/**
 * Relay worker for energynet-tracker.org.
 *  POST /submit          contribution form → opens a pull request with a new project file
 *  GET  /oauth/auth      Decap CMS GitHub OAuth start
 *  GET  /oauth/callback  Decap CMS GitHub OAuth finish
 */
const GH = 'https://api.github.com';

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const cors = {
      'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
    if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
    try {
      if (url.pathname === '/submit' && req.method === 'POST') return json(await submit(await req.json(), env), 200, cors);
      if (url.pathname === '/oauth/auth') return oauthStart(url, env);
      if (url.pathname === '/oauth/callback') return oauthCallback(url, env);
      return json({ error: 'not found' }, 404, cors);
    } catch (e) {
      return json({ error: e.message ?? String(e) }, e.status ?? 500, cors);
    }
  },
};

const json = (body, status = 200, headers = {}) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...headers } });
const fail = (msg, status = 400) => Object.assign(new Error(msg), { status });

const slugify = (s) => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
const yamlStr = (s) => JSON.stringify(String(s ?? ''));
const lines = (s) => String(s ?? '').split('\n').map((l) => l.trim()).filter(Boolean);

function buildProjectFile(d) {
  const required = ['title', 'summary', 'stage', 'type', 'scale', 'country', 'parties', 'links', 'body', 'contact'];
  for (const k of required) if (!d[k] || !String(d[k]).trim()) throw fail(`Missing field: ${k}`);
  if (d.website) throw fail('Rejected');
  if (String(d.summary).length > 280) throw fail('Summary too long');
  const stage = String(d.stage), type = String(d.type), scale = String(d.scale);
  const country = String(d.country).toUpperCase();
  if (!/^[A-Z]{2}$/.test(country)) throw fail('Country must be a 2-letter code');

  const locations = lines(d.locations).map((l) => {
    const parts = l.split(',').map((x) => x.trim());
    const lng = parseFloat(parts.pop()), lat = parseFloat(parts.pop());
    if (Number.isNaN(lat) || Number.isNaN(lng)) throw fail(`Bad location line: ${l}`);
    return { name: parts.join(', '), lat, lng };
  });
  const parties = lines(d.parties).map((l) => {
    const [name, role = 'Participant', website = ''] = l.split(',').map((x) => x.trim());
    return { name, slug: slugify(name), role, website };
  });
  const links = lines(d.links).map((l) => {
    const i = l.lastIndexOf(',');
    const label = i > 0 ? l.slice(0, i).trim() : 'Source';
    const url = (i > 0 ? l.slice(i + 1) : l).trim();
    if (!/^https?:\/\//.test(url)) throw fail(`Bad link: ${l}`);
    return { label, url };
  });
  const tags = String(d.tags ?? '').split(',').map((t) => slugify(t)).filter(Boolean);
  const today = new Date().toISOString().slice(0, 10);
  const confidential = d.confidential === 'yes' || d.confidential === true;

  const fm = [
    '---',
    `title: ${yamlStr(d.title)}`,
    `summary: ${yamlStr(d.summary)}`,
    `stage: ${stage}`, `type: ${type}`, `scale: ${scale}`,
    `tags: [${tags.join(', ')}]`,
    `country: ${country}`,
    'locations:',
    ...locations.flatMap((l) => [`  - name: ${yamlStr(l.name)}`, `    lat: ${l.lat}`, `    lng: ${l.lng}`]),
    'parties:',
    ...(confidential ? [] : parties.flatMap((p) => [`  - org: ${p.slug}`, `    role: ${yamlStr(p.role)}`])),
    'links:',
    ...links.flatMap((l) => [`  - label: ${yamlStr(l.label)}`, `    url: ${yamlStr(l.url)}`]),
    ...(d.started ? [`started: ${yamlStr(d.started)}`] : []),
    `added: ${today}`,
    'verified: false',
    ...(confidential ? ['confidential: true'] : []),
    '---',
  ];
  return { slug: slugify(d.title), content: fm.join('\n') + '\n' + String(d.body).trim() + '\n', parties: confidential ? [] : parties, confidential, partiesNote: confidential ? parties.map((p) => `${p.name} (${p.role}) ${p.website}`).join('; ') : '' };
}

async function gh(env, path, init = {}) {
  const r = await fetch(GH + path, {
    ...init,
    headers: { Authorization: `Bearer ${env.GITHUB_TOKEN}`, Accept: 'application/vnd.github+json', 'User-Agent': 'energynet-tracker-relay', 'Content-Type': 'application/json', ...(init.headers ?? {}) },
  });
  if (!r.ok) throw fail(`GitHub ${path}: ${r.status} ${await r.text()}`, 502);
  return r.json();
}

async function submit(d, env) {
  const { slug, content, parties, confidential, partiesNote } = buildProjectFile(d);
  if (!slug) throw fail('Title produces an empty slug');
  const repo = env.REPO;
  const main = await gh(env, `/repos/${repo}/git/ref/heads/main`);
  const branch = `submit/${slug}-${Date.now().toString(36)}`;
  await gh(env, `/repos/${repo}/git/refs`, { method: 'POST', body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: main.object.sha }) });

  const put = (path, text, message) => gh(env, `/repos/${repo}/contents/${path}`, { method: 'PUT', body: JSON.stringify({ message, branch, content: btoa(unescape(encodeURIComponent(text))) }) });
  await put(`src/content/projects/${slug}.md`, content, `content: add project “${d.title}” (web submission)`);

  // Stub organisation files for parties that don't exist yet, so the build passes and the editor only has to fill in HQ coordinates.
  const missing = [];
  for (const p of parties) {
    const r = await fetch(`${GH}/repos/${repo}/contents/src/content/organisations/${p.slug}.md?ref=main`, { headers: { Authorization: `Bearer ${env.GITHUB_TOKEN}`, 'User-Agent': 'energynet-tracker-relay' } });
    if (r.status === 404) {
      missing.push(p.slug);
      const org = ['---', `name: ${yamlStr(p.name)}`, 'kind: other', ...(p.website ? [`website: ${yamlStr(p.website)}`] : []), `country: ${String(d.country).toUpperCase()}`, 'city: "TODO"', 'lat: 0', 'lng: 0', '---', ''].join('\n');
      await put(`src/content/organisations/${p.slug}.md`, org, `content: stub organisation “${p.name}”`);
    }
  }

  // Contact details and, for confidential projects, the parties go to a PRIVATE repo issue. The public PR never carries them.
  let privateRef = 'no private repo configured; contact details were dropped';
  if (env.PRIVATE_REPO) {
    const priv = await gh(env, `/repos/${env.PRIVATE_REPO}/issues`, { method: 'POST', body: JSON.stringify({
      title: `Intake: ${d.title}${confidential ? ' (confidential)' : ''}`,
      body: [`Public PR: ${repo}#(see below)`, '', `**Contact:** ${d.contact}`, '', ...(confidential ? ['**Confidential project. Parties, editors only, never publish:**', '', partiesNote] : [])].join('\n'),
    }) });
    privateRef = `editor details in ${env.PRIVATE_REPO}#${priv.number}`;
  }
  const body = [
    `Web submission from the contribute form (${privateRef}).`, '',
    ...(confidential ? ['**Confidential project:** listed by city only, parties intentionally omitted from this file.', ''] : []),
    missing.length ? `New organisation stubs need kind, city and HQ coordinates: ${missing.map((m) => `\`${m}\``).join(', ')}` : 'All parties already existed as organisations.', '',
    '## Editor checklist', '- [ ] In scope (EnergyNet / Energy Protocol lineage)', '- [ ] Sources checked', '- [ ] Locations verified', '- [ ] Organisation stubs completed', '- [ ] `verified: true` if confirmed',
  ].join('\n');
  const pr = await gh(env, `/repos/${repo}/pulls`, { method: 'POST', body: JSON.stringify({ title: `Project: ${d.title}`, head: branch, base: 'main', body }) });
  await gh(env, `/repos/${repo}/issues/${pr.number}/labels`, { method: 'POST', body: JSON.stringify({ labels: ['project-submission'] }) }).catch(() => {});
  return { ok: true, number: pr.number, url: pr.html_url };
}

// --- Decap CMS GitHub OAuth (standard "external OAuth client" handshake) ---
function oauthStart(url, env) {
  const state = crypto.randomUUID();
  const redirect = `${url.origin}/oauth/callback`;
  const to = `https://github.com/login/oauth/authorize?client_id=${env.OAUTH_CLIENT_ID}&scope=repo,user&state=${state}&redirect_uri=${encodeURIComponent(redirect)}`;
  return new Response(null, { status: 302, headers: { Location: to, 'Set-Cookie': `oauth_state=${state}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600` } });
}

async function oauthCallback(url, env) {
  const code = url.searchParams.get('code');
  const r = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'User-Agent': 'energynet-tracker-relay' },
    body: JSON.stringify({ client_id: env.OAUTH_CLIENT_ID, client_secret: env.OAUTH_CLIENT_SECRET, code }),
  });
  const data = await r.json();
  const status = data.access_token ? 'success' : 'error';
  const payload = data.access_token ? { token: data.access_token, provider: 'github' } : { error: data.error_description ?? 'OAuth failed' };
  const html = `<!doctype html><script>
    (function(){ var msg = 'authorization:github:${status}:' + ${JSON.stringify(JSON.stringify(payload))};
      function send(){ window.opener.postMessage(msg, '*'); }
      window.addEventListener('message', function(e){ if (/^authorizing:github/.test(e.data)) send(); });
      window.opener.postMessage('authorizing:github', '*'); })();
  </script>`;
  return new Response(html, { headers: { 'Content-Type': 'text/html' } });
}
