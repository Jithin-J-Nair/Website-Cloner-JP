#!/usr/bin/env node
/** Keep application validation strict without compiling research/vendor examples. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { ESLint } from 'eslint';

const root = process.cwd();
const testsRoot = path.join(root, 'tests');
const createdTestsRoot = !fs.existsSync(testsRoot);
fs.mkdirSync(testsRoot, { recursive: true });
fs.mkdirSync(path.join(root, 'temp'), { recursive: true });
const testDir = fs.mkdtempSync(path.join(testsRoot, 'validation-boundary-'));
const scratchDir = fs.mkdtempSync(path.join(root, 'temp', 'validation-boundary-'));
const testFile = path.join(testDir, 'included.ts');
const scratchFile = path.join(scratchDir, 'unrelated-example.tsx');
try {
  fs.writeFileSync(testFile, 'export const checkedApplicationTest: string = "included";\n');
  fs.writeFileSync(scratchFile, 'import "unrelated-skill-only-dependency";\n');
  const config = ts.readConfigFile(path.join(root, 'tsconfig.json'), ts.sys.readFile);
  assert.equal(config.error, undefined, 'tsconfig parses');
  const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, root);
  assert.deepEqual(parsed.errors, [], 'TypeScript configuration remains valid');
  const names = new Set(parsed.fileNames.map(file => path.resolve(file)));
  assert.equal(names.has(scratchFile), false, 'scratch examples are not application TypeScript roots');
  assert.equal(names.has(testFile), true, 'application tests remain type checked');
  assert.equal(names.has(path.join(root, 'src/app/layout.tsx')), true, 'application source remains type checked');
  assert.equal(parsed.options.strict, true, 'strict TypeScript stays enabled');
  assert.equal(parsed.options.noEmit, true, 'typecheck does not emit files');
  assert.ok(config.config.exclude.includes('skills'), 'read-only skill examples are not application roots');

  const eslint = new ESLint();
  assert.equal(await eslint.isPathIgnored(scratchFile), true, 'scratch is excluded from application ESLint');
  assert.equal(await eslint.isPathIgnored(path.join(root, 'skills/example/SKILL-example.tsx')), true, 'vendor skills are excluded from application ESLint');
  assert.equal(await eslint.isPathIgnored(testFile), false, 'application tests remain linted');
  assert.equal(await eslint.isPathIgnored(path.join(root, 'src/app/layout.tsx')), false, 'application source remains linted');
  const lintConfig = await eslint.calculateConfigForFile(path.join(root, 'src/app/layout.tsx'));
  assert.notEqual(lintConfig.rules['@typescript-eslint/no-explicit-any']?.[0], 0, 'no-explicit-any rule remains enabled');
  assert.notEqual(lintConfig.rules['react-hooks/rules-of-hooks']?.[0], 0, 'hooks rule remains enabled');
  console.log('PASS validation boundaries: scratch/vendor excluded; application source/tests and strict rules retained.');
} finally {
  fs.rmSync(testDir, { recursive: true });
  fs.rmSync(scratchDir, { recursive: true });
  if (createdTestsRoot && fs.readdirSync(testsRoot).length === 0) fs.rmdirSync(testsRoot);
}
