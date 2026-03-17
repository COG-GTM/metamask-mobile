import fs from 'fs';
import path from 'path';
import {
  EXISTING_JS_FILES_ALLOWLIST,
  ALLOWLIST_SET,
  checkTypescriptAppGate,
  findFilesWithExtensions,
} from './typescript-app-gate';

// Create a temporary directory structure for testing
const TEST_DIR = path.join(__dirname, '__test_app_gate__');

function createTestDir(): void {
  fs.mkdirSync(TEST_DIR, { recursive: true });
}

function cleanTestDir(): void {
  fs.rmSync(TEST_DIR, { recursive: true, force: true });
}

function createFile(relativePath: string): void {
  const fullPath = path.join(TEST_DIR, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, '// test file');
}

describe('EXISTING_JS_FILES_ALLOWLIST', (): void => {
  it('should be a non-empty array', (): void => {
    expect(EXISTING_JS_FILES_ALLOWLIST.length).toBeGreaterThan(0);
  });

  it('should be sorted alphabetically', (): void => {
    const sorted = [...EXISTING_JS_FILES_ALLOWLIST].sort();
    expect(EXISTING_JS_FILES_ALLOWLIST).toEqual(sorted);
  });

  it('should only contain files with .js or .jsx extensions', (): void => {
    EXISTING_JS_FILES_ALLOWLIST.forEach((file) => {
      expect(file).toMatch(/\.(js|jsx)$/);
    });
  });

  it('should only contain files under app/', (): void => {
    EXISTING_JS_FILES_ALLOWLIST.forEach((file) => {
      expect(file.startsWith('app/')).toBe(true);
    });
  });

  it('should not contain duplicates', (): void => {
    expect(ALLOWLIST_SET.size).toBe(EXISTING_JS_FILES_ALLOWLIST.length);
  });
});

describe('findFilesWithExtensions()', (): void => {
  beforeEach((): void => {
    createTestDir();
  });

  afterEach((): void => {
    cleanTestDir();
  });

  it('should find .js files in the directory', (): void => {
    createFile('test.js');
    createFile('test.ts');

    const result = findFilesWithExtensions(TEST_DIR, ['.js']);

    expect(result).toHaveLength(1);
    expect(result[0]).toContain('test.js');
  });

  it('should find files recursively', (): void => {
    createFile('sub/deep/test.js');
    createFile('other.jsx');

    const result = findFilesWithExtensions(TEST_DIR, ['.js', '.jsx']);

    expect(result).toHaveLength(2);
  });

  it('should return empty array when no matching files exist', (): void => {
    createFile('test.ts');
    createFile('test.tsx');

    const result = findFilesWithExtensions(TEST_DIR, ['.js', '.jsx']);

    expect(result).toHaveLength(0);
  });

  it('should return sorted results', (): void => {
    createFile('z.js');
    createFile('a.js');
    createFile('m.js');

    const result = findFilesWithExtensions(TEST_DIR, ['.js']);

    const fileNames = result.map((f) => path.basename(f));
    expect(fileNames).toEqual(['a.js', 'm.js', 'z.js']);
  });
});

describe('checkTypescriptAppGate()', (): void => {
  // checkTypescriptAppGate expects a repo root that contains an app/ subdirectory
  const MOCK_REPO_ROOT = TEST_DIR;
  const MOCK_APP_DIR = path.join(TEST_DIR, 'app');

  beforeEach((): void => {
    fs.mkdirSync(MOCK_APP_DIR, { recursive: true });
  });

  afterEach((): void => {
    cleanTestDir();
  });

  it('should pass when no .js or .jsx files exist', (): void => {
    fs.mkdirSync(path.join(MOCK_APP_DIR, 'components'), { recursive: true });
    fs.writeFileSync(
      path.join(MOCK_APP_DIR, 'components', 'test.ts'),
      '// ts file',
    );

    const result = checkTypescriptAppGate(MOCK_REPO_ROOT);

    expect(result.passed).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it('should fail when a .js file exists that is not in the allowlist', (): void => {
    fs.writeFileSync(path.join(MOCK_APP_DIR, 'brand-new.js'), '// new js');

    const result = checkTypescriptAppGate(MOCK_REPO_ROOT);

    expect(result.passed).toBe(false);
    expect(result.violations.length).toBeGreaterThan(0);
    expect(result.violations[0]).toContain('brand-new.js');
  });

  it('should fail when a .jsx file exists that is not in the allowlist', (): void => {
    fs.writeFileSync(path.join(MOCK_APP_DIR, 'brand-new.jsx'), '// new jsx');

    const result = checkTypescriptAppGate(MOCK_REPO_ROOT);

    expect(result.passed).toBe(false);
    expect(result.violations.length).toBeGreaterThan(0);
    expect(result.violations[0]).toContain('brand-new.jsx');
  });

  it('should report all violations when multiple new .js files exist', (): void => {
    fs.writeFileSync(path.join(MOCK_APP_DIR, 'new-a.js'), '// a');
    fs.writeFileSync(path.join(MOCK_APP_DIR, 'new-b.jsx'), '// b');

    const result = checkTypescriptAppGate(MOCK_REPO_ROOT);

    expect(result.passed).toBe(false);
    expect(result.violations).toHaveLength(2);
  });
});
