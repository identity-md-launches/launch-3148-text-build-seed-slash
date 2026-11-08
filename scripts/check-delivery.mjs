import assert from 'node:assert/strict';
import { readFile, readdir, writeFile, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';

const excluded = new Set(['.git', '.github', '.imd', 'node_modules', '.cache', '.npm-cache', '.vite']);
async function list(dir = '.') {
  const files = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = dir === '.' ? entry.name : `${dir}/${entry.name}`;
    if (excluded.has(entry.name) || entry.name === '.env' || entry.name.startsWith('.env.') || path === 'test/scratch') continue;
    assert.ok(!entry.isSymbolicLink(), `Deliverable must not contain a symlink: ${path}`);
    if (entry.isDirectory()) files.push(...await list(path));
    else if (entry.isFile()) files.push(path);
  }
  return files.sort();
}
const digest = data => createHash('sha256').update(data).digest('hex');
const html = await readFile('dist/index.html', 'utf8');
assert.ok(html.includes('<title>Seed Slash'), 'Real page title is required');
for (const key of ['name="description"', 'property="og:title"', 'property="og:image"', 'rel="icon"']) assert.ok(html.includes(key), `Missing ${key}`);
for (const match of html.matchAll(/(?:src|href|content)="([^"]+)"/g)) {
  const value = match[1];
  if (!/\.(?:js|css|svg|png|woff2)$/.test(value)) continue;
  assert.ok(value.startsWith('./'), `Index assets must be relative: ${value}`);
  await readFile(resolve('dist', value));
}
const assets = [];
for (const path of await list('public')) {
  const source = await readFile(path), exported = await readFile(path.replace(/^public\//, 'dist/'));
  assert.equal(digest(source), digest(exported), `Export asset mismatch: ${path}`);
  assets.push(path.replace(/^public\//, ''));
}
for (const path of (await list('dist/assets')).filter(p => p.endsWith('.css'))) {
  for (const [, value] of (await readFile(path, 'utf8')).matchAll(/url\((?:["'])?([^\)'" ]+)/g)) {
    if (value.startsWith('data:') || value.startsWith('#')) continue;
    assert.ok(value.startsWith('../') || value.startsWith('./'), `CSS asset is not relative: ${value}`);
    await readFile(resolve('dist/assets', value));
  }
}
for (const path of (await list('dist/assets')).filter(p => p.endsWith('.js'))) {
  const js = await readFile(path, 'utf8');
  assert.ok(!js.includes('__drawnNuts') && !js.includes('test outage'), 'Test fixtures/hooks must not ship');
}
const image = await readFile('dist/art/social.png');
assert.equal(image.readUInt32BE(16), 1200); assert.equal(image.readUInt32BE(20), 630);
for (const name of ['lilita-latin', 'nunito-latin']) assert.equal((await readFile(`dist/fonts/${name}.woff2`)).toString('ascii', 0, 4), 'wOF2');
const manifest = JSON.parse(await readFile('package.json', 'utf8'));
const lock = JSON.parse(await readFile('package-lock.json', 'utf8'));
assert.deepEqual(manifest.dependencies, lock.packages[''].dependencies);
assert.deepEqual(manifest.devDependencies, lock.packages[''].devDependencies);
for (const item of Object.values(lock.packages)) {
  if (item.resolved) assert.equal(new URL(item.resolved).hostname, 'registry.npmjs.org', 'Lockfile must use the public npm registry');
}

const records = [];
for (const path of await list()) {
  if (path === 'artifacts/bundle-budget.json') continue;
  assert.ok(!/\.(?:tgz|zip|deb|tar|gz)$/.test(path), `Unnecessary archive in submission: ${path}`);
  assert.ok(path !== '.gitmodules', 'Submodules are not allowed');
  records.push({ path, bytes: (await stat(path)).size });
}
const capBytes = 8_388_608;
const output = { capBytes, totalBytes: 0, fileCount: records.length + 1,
  excludedGeneratedPaths: ['**/node_modules/', '**/.npm-cache/', '**/.vite/', '**/.cache/', 'test/scratch/'],
  excludedInputs: ['.imd/'], relativeAssetsVerified: true, publicAssetsMatched: assets,
  exportHash: digest(html), files: [...records, { path: 'artifacts/bundle-budget.json', bytes: 0 }] };
let body = '';
for (let i = 0; i < 12; i++) {
  output.files.at(-1).bytes = Buffer.byteLength(body);
  output.totalBytes = output.files.reduce((sum, file) => sum + file.bytes, 0);
  const next = JSON.stringify(output, null, 2) + '\n';
  if (next === body) break;
  body = next;
}
assert.ok(output.totalBytes <= capBytes, `Submission exceeds budget: ${output.totalBytes}`);
await writeFile('artifacts/bundle-budget.json', body);
console.log(`Delivery verified: ${output.fileCount} files, ${output.totalBytes.toLocaleString()} / ${capBytes.toLocaleString()} bytes; ${assets.length} public assets match the export.`);
