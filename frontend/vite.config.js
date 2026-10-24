import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Menyisipkan CSS langsung ke index.html saat build, supaya CSS tidak lagi menjadi
// permintaan terpisah yang memblokir render pertama.
function inlineCss() {
  return {
    name: 'inline-css',
    apply: 'build',
    enforce: 'post',
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        const bundle = ctx.bundle || {};
        return html.replace(/<link rel="stylesheet"[^>]*href="([^"]+\.css)"[^>]*>/g, (tag, href) => {
          const nama = Object.keys(bundle).find((k) => href.endsWith(k));
          if (!nama || bundle[nama].type !== 'asset') return tag;
          const css = String(bundle[nama].source);
          delete bundle[nama];
          return `<style>${css}</style>`;
        });
      },
    },
  };
}

export default defineConfig({
  plugins: [react(), inlineCss()],
  server: { port: 5173 },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/setupTests.js'],
    css: false,
    include: ['src/**/*.test.{js,jsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{js,jsx}'],
      exclude: ['src/**/*.test.*', 'src/main.jsx', 'src/setupTests.js', 'src/test-utils.jsx'],
    },
  },
});
