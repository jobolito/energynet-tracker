import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://energynet-tracker.org',
  trailingSlash: 'never',
  build: { format: 'file' },
  vite: { ssr: { external: ['@resvg/resvg-js'] } },
});
