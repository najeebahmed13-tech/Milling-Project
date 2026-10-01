import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const rootDir = path.resolve(path.dirname(__filename), '..');

test('PUBLIC / MAIN REPOSITORY folder structure is complete', () => {
  const publicDirs = [
    'apps',
    'modules',
    'packages',
    'core/contracts',
    'tests',
    'docs/public'
  ];

  for (const dir of publicDirs) {
    const fullPath = path.join(rootDir, dir);
    assert.equal(fs.existsSync(fullPath), true, `Missing directory: ${dir}`);
  }
});

test('PRIVATE CORE REPOSITORIES folder structure is complete', () => {
  const coreEngines = [
    'risk-engine',
    'pricing-engine',
    'policy-engine',
    'entitlement-engine',
    'security-engine'
  ];

  for (const engine of coreEngines) {
    const fullPath = path.join(rootDir, 'private-core-repositories', engine);
    assert.equal(fs.existsSync(fullPath), true, `Missing core engine: ${engine}`);
    assert.equal(fs.existsSync(path.join(fullPath, 'README.md')), true, `Missing README in ${engine}`);
    assert.equal(fs.existsSync(path.join(fullPath, 'index.js')), true, `Missing index.js in ${engine}`);
  }
});

test('PRIVATE OPERATIONS REPOSITORY folder structure is complete', () => {
  const opsDirs = [
    'infrastructure',
    'production',
    'security-policies',
    'runbooks',
    'restricted-docs'
  ];

  for (const dir of opsDirs) {
    const fullPath = path.join(rootDir, 'private-operations-repository', dir);
    assert.equal(fs.existsSync(fullPath), true, `Missing operations directory: ${dir}`);
    assert.equal(fs.existsSync(path.join(fullPath, 'README.md')), true, `Missing README in ${dir}`);
  }
});

