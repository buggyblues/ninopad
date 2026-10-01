import { defineConfig } from 'vite';
import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';
function htmlFiles(directory = '.') {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const file = `${directory}/${entry.name}`;
    if (entry.isDirectory()) return ['en', 'blog'].includes(entry.name) || directory !== '.' ? htmlFiles(file) : [];
    return entry.name.endsWith('.html') ? [resolve(file)] : [];
  });
}
export default defineConfig({
  publicDir: 'public',
  build: { rolldownOptions: { input: htmlFiles() } },
  server: { port: 5173, strictPort: true },
  preview: { port: 4173, strictPort: true }
});
