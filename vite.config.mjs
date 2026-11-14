import { cp, readFile, readdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
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
  // Relative URLs so the build works from the domain root or from a subfolder
  // (e.g. a GitHub Pages project site). The page's own scripts already use relative paths.
  base: './',
  plugins: [(() => {
    let outDir = resolve(root, 'dist');
    return {
      name: 'copy-static-portfolio-files',
      apply: 'build',
      // Follow the resolved build.outDir (so `vite build --outDir x` is respected).
      configResolved(config) {
        outDir = resolve(config.root, config.build.outDir);
      },
      async closeBundle() {
        await Promise.all(['js', 'assets'].map((directory) =>
          cp(join(root, directory), join(outDir, directory), { recursive: true })
        ));
        await minifyScripts(join(outDir, 'js'));
      }
    };
  })()]
});
