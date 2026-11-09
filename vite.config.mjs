import { cp, readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, minify } from 'vite';

const root = fileURLToPath(new URL('.', import.meta.url));

async function minifyScripts(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      await minifyScripts(path);
    } else if (entry.name.endsWith('.js')) {
      const source = await readFile(path, 'utf8');
      const { code, errors } = await minify(path, source, {
        compress: true,
        mangle: true
      });
      if (errors.length) throw new Error(`Unable to minify ${path}: ${errors[0].message}`);
      await writeFile(path, code);
    }
  }
}

export default defineConfig({
  plugins: [{
    name: 'copy-static-portfolio-files',
    apply: 'build',
    async closeBundle() {
      await Promise.all(['js', 'assets'].map((directory) =>
        cp(`${root}${directory}`, `${root}dist/${directory}`, { recursive: true })
      ));
      await minifyScripts(`${root}dist/js`);
    }
  }]
});
