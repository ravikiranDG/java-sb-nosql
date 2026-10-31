import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = file => readFile(path.join(root, file), 'utf8');
const manifest = { window: {} };
vm.runInNewContext(await read('topics.js'), manifest);
const tracks = manifest.window.TRACKS;
const files = tracks.flatMap(track => track.topics.map(([id]) => `${track.id}/${id}.md`));
const markdown = new Map(await Promise.all(files.map(async file => [file, await read(file)])));
const stripCode = text => text.replace(/```[\s\S]*?```/g, '');
const slugs = text => [...stripCode(text).matchAll(/^#{2,3} (.+)$/gm)].map(([, heading]) =>
  heading.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));

test('manifest has 3 tracks, 26 unique chapters, and no unlisted chapters', async () => {
  assert.equal(tracks.length, 3);
  assert.equal(files.length, 26);
  assert.equal(new Set(files).size, files.length);
  for (const track of tracks) {
    const actual = (await readdir(path.join(root, track.id))).filter(file => file.endsWith('.md'));
    assert.deepEqual(actual.sort(), [...track.topics.map(([id]) => `${id}.md`)].sort());
  }
});

test('64 interview-bank questions contain model answers, traps and follow-ups', () => {
  let total = 0;
  for (const track of tracks) {
    const text = markdown.get(`${track.id}/interview-questions.md`);
    const questions = [...text.matchAll(/^## Q(\d+)\. .+$/gm)];
    assert.equal(questions.length, track.interviewQuestions);
    total += questions.length;
    questions.forEach((question, index) => {
      assert.equal(Number(question[1]), index + 1, 'sequential question numbering');
      const end = questions[index + 1]?.index ?? text.indexOf('## Self-checks', question.index);
      assert.ok(end > question.index, 'question has a complete section');
      const answer = text.slice(question.index, end);
      assert.ok(answer.includes('Model answer:'), 'model answer provided');
      assert.ok(answer.includes('**Trap:**'), 'common mistake explained');
      assert.ok(answer.includes('**Follow-up:**'), 'follow-up provided');
      assert.ok(answer.split(/\s+/).length >= 50, 'more than a one-line definition');
    });
  }
  assert.equal(total, 64);
  assert.equal([...markdown.values()].reduce((sum, text) => sum + (text.match(/<details>/g) || []).length, 0), 78);
});

for (const [file, text] of markdown) {
  test(`${file}: substantive explanation, 3 answered checks, sources and valid internal links`, async () => {
    assert.equal((text.match(/^# /gm) || []).length, 1, 'one top-level title');
    assert.ok(text.includes('> **Interview answer:**'));
    assert.ok(text.split(/\s+/).length >= 350, 'at least 350 words');
    assert.equal((text.match(/<details>/g) || []).length, 3);
    assert.equal((text.match(/<\/details>/g) || []).length, 3);
    assert.equal((text.match(/<summary>/g) || []).length, 3);
    assert.ok(/^## (Sources|Read next and sources)$/m.test(text));
    assert.ok(text.includes('https://'), 'primary documentation links');
    assert.equal((text.match(/^```/gm) || []).length % 2, 0, 'balanced code fences');
    for (const [, href] of stripCode(text).matchAll(/\]\(([^)]+)\)/g)) {
      if (/^[a-z][a-z0-9+.-]*:/i.test(href)) continue;
      const [target, anchor] = href.split('#');
      const resolved = target ? path.posix.normalize(path.posix.join(path.posix.dirname(file), target)) : file;
      assert.ok(markdown.has(resolved), `${href} resolves to a listed chapter`);
      if (anchor) assert.ok(slugs(markdown.get(resolved)).includes(anchor), `${href} has a valid heading anchor`);
    }
    assert.ok((await stat(path.join(root, file))).isFile());
  });
}

test('HTML assets exist, scripts parse and no runtime CDN is needed', async () => {
  const html = await read('index.html');
  for (const [, href] of html.matchAll(/(?:src|href)="([^"]+\.(?:js|css))"/g)) {
    assert.ok(!href.startsWith('http'), 'self-hosted runtime assets');
    assert.ok((await stat(path.join(root, href))).isFile());
  }
  for (const file of ['app.js', 'topics.js', 'vendor/marked.umd.js', 'vendor/purify.min.js']) {
    execFileSync(process.execPath, ['--check', path.join(root, file)]);
  }
  for (const license of ['vendor/marked.LICENSE.md', 'vendor/DOMPurify.LICENSE']) {
    assert.ok((await read(license)).length > 500, 'preserve complete vendor licenses');
  }
});

test('deploy artifact contains only expected public files', async () => {
  execFileSync(process.execPath, [path.join(root, 'scripts', 'build.mjs')]);
  const entries = (await readdir(path.join(root, 'dist'))).sort();
  assert.deepEqual(entries, [
    '.nojekyll', 'app.js', 'index.html', 'java', 'mongodb',
    'spring-boot', 'styles.css', 'topics.js', 'vendor'
  ]);
  for (const file of files) {
    assert.equal(await readFile(path.join(root, 'dist', file), 'utf8'), markdown.get(file));
  }
});
