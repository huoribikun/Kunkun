import { cp, mkdir, readdir, readFile, rm, writeFile, access } from 'node:fs/promises';
import { resolve, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import vm from 'node:vm';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = resolve(root, 'src');
const output = resolve(root, 'dist');
async function filesAt(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const lists = await Promise.all(entries.map(entry => entry.isDirectory()
    ? filesAt(resolve(directory, entry.name)) : [resolve(directory, entry.name)]));
  return lists.flat().sort();
}
const sourceFiles = await filesAt(source);
for (const file of sourceFiles) {
  if (/\.(?:m?js)$/.test(file)) execFileSync(process.execPath, ['--check', file], { stdio: 'inherit' });
  if (/\.(?:html|css|m?js)$/.test(file)) {
    const text = await readFile(file, 'utf8');
    const refs = [...text.matchAll(/(?:src|href)=["']([^"']+)["']|url\(\s*["']?([^\s"')]+)|(?:from\s*|import\s*)["'](\.[^"']+)["']/g)];
    for (const match of refs) {
      const value = (match[1] || match[2] || match[3]).split(/[?#]/)[0];
      if (!value || /^(?:[a-z]+:|\/\/)/i.test(value)) continue;
      const target = value.startsWith('/') ? resolve(source, '.' + value) : resolve(dirname(file), value);
      await access(target).catch(() => { throw new Error(`Missing reference ${value} in ${relative(source, file)}`); });
    }
  }
}
const context = { window: {} };
vm.runInNewContext(await readFile(resolve(source, 'portfolio-data.js'), 'utf8'), context);
const sections = context.window.portfolioSections;
const artworks = sections.flatMap(section => section.groups.flatMap(group => group.images));
for (const image of artworks) for (const key of ['src', 'thumb', 'original']) await access(resolve(source, image[key]));
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp(source, output, { recursive: true });
const files = [];
for (const file of await filesAt(output)) {
  const data = await readFile(file);
  files.push({ path: relative(output, file).replaceAll('\\', '/'), bytes: data.length, sha256: createHash('sha256').update(data).digest('hex') });
}
const metadata = JSON.parse(await readFile(resolve(root, 'EXPORT-INFO.json'), 'utf8'));
await writeFile(resolve(output, 'BUILD-INFO.json'), JSON.stringify({
  project: '焜焜 · 设计与插画作品集', sourceCommit: metadata.sourceCommit,
  format: 'static HTML/CSS/JavaScript', sections: sections.length, artworks: artworks.length, files
}, null, 2) + '\n');
console.log(`Production build complete: ${sections.length} collections, ${artworks.length} artworks, ${files.length} files → dist/`);
