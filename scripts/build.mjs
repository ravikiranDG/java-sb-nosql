import { mkdir, readdir, copyFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, 'dist');
const files = ['index.html', 'styles.css', 'app.js', 'topics.js', '.nojekyll'];
const directories = ['java', 'spring-boot', 'mongodb', 'vendor'];

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const name of files) await copyFile(path.join(root, name), path.join(output, name));
for (const directory of directories) {
  await mkdir(path.join(output, directory), { recursive: true });
  for (const entry of await readdir(path.join(root, directory), { withFileTypes: true })) {
    if (!entry.isFile()) throw new Error(`Unexpected nested directory in ${directory}: ${entry.name}`);
    await copyFile(path.join(root, directory, entry.name), path.join(output, directory, entry.name));
  }
}
console.log('Built static guide in dist (site assets and chapters only).');
