import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const root = fileURLToPath(new URL('../', import.meta.url));
const documents = ['java/ordering.md', 'java/custom-exceptions.md', 'java/interview-questions.md'];
const expected = new Map([
  ['OrderingDemo', 'Natural: [1, 2, 3]\nSalary ascending: [2, 1, 3]\nSalary descending: [1, 3, 2]\nSalary-only set size: 2\nSafe integer comparison: -1'],
  ['CustomExceptionDemo', 'Insufficient balance: requested 75, available 50\nRequested: 75\nBalance unchanged: 50\nCause is IOException: true'],
  ['DistinctWindowDemo', '3\n2\n0\n3']
]);
const output = await mkdtemp(path.join(tmpdir(), 'java-interview-check-'));

try {
  const programs = new Map();
  for (const file of documents) {
    const text = await readFile(path.join(root, file), 'utf8');
    for (const [, name, source] of text.matchAll(/```java runnable=(\w+)\r?\n([\s\S]*?)```/g)) {
      assert.ok(!programs.has(name), `duplicate program ${name}`);
      programs.set(name, source);
    }
  }
  assert.deepEqual([...programs.keys()].sort(), [...expected.keys()].sort());
  const sources = [];
  for (const [name, source] of programs) {
    const file = path.join(output, `${name}.java`);
    await writeFile(file, source);
    sources.push(file);
  }
  sources.push(path.join(root, 'tests', 'java', 'InterviewExampleChecks.java'));
  execFileSync('javac', ['--release', '21', '-encoding', 'UTF-8', '-d', output, ...sources], {
    encoding: 'utf8', timeout: 30000
  });
  for (const [name, wanted] of expected) {
    const actual = execFileSync('java', ['-cp', output, name], {
      encoding: 'utf8', timeout: 10000
    }).replace(/\r\n/g, '\n').trim();
    assert.equal(actual, wanted, `${name} matches documented output`);
    console.log(`${name}: compiled and documented output matched`);
  }
  const checks = execFileSync('java', ['-cp', output, 'InterviewExampleChecks'], {
    encoding: 'utf8', timeout: 10000
  }).trim();
  assert.equal(checks, 'Ordering contracts, exception boundaries, and 1093 exhaustive window inputs passed');
  console.log(checks);
} finally {
  await rm(output, { recursive: true, force: true });
}
