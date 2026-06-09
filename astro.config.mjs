import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: cloudflare({
    platformProxy: {
      enabled: true,
    },
  }),
  vite: {
    plugins: [tailwindcss()],
    server: {
      watch: {
        // Ignorar cambios en la base de datos local de Cloudflare para evitar recargas infinitas
        ignored: ['**/.wrangler/**'],
      },
    },
  },
});
