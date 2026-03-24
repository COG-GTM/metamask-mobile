// eslint-disable-next-line import/no-nodejs-modules
import fs from 'fs';
// eslint-disable-next-line import/no-nodejs-modules
import path from 'path';

/**
 * Recursively extracts all dot-separated key paths from a nested object.
 * e.g. { a: { b: "x", c: "y" } } => ["a.b", "a.c"]
 */
function extractKeys(obj, prefix = '') {
  return Object.keys(obj).reduce((keys, key) => {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      return keys.concat(extractKeys(obj[key], fullKey));
    }
    return keys.concat(fullKey);
  }, []);
}

const languagesDir = path.resolve(__dirname, 'languages');

// Load en.json as the source of truth
const enData = JSON.parse(
  fs.readFileSync(path.join(languagesDir, 'en.json'), 'utf8'),
);
const enKeys = extractKeys(enData);

// Locale codes imported in i18n.js (excluding 'en' which is the source of truth)
const localeCodes = [
  'de',
  'el',
  'es',
  'fr',
  'hi',
  'id',
  'ja',
  'ko',
  'pt',
  'ru',
  'tl',
  'tr',
  'vi',
  'zh',
];

describe('i18n key parity', () => {
  describe.each(localeCodes)('%s locale', (locale) => {
    const filePath = path.join(languagesDir, `${locale}.json`);
    const localeData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const localeKeys = extractKeys(localeData);
    const localeKeySet = new Set(localeKeys);
    const enKeySet = new Set(enKeys);

    it('should contain every key that exists in en.json', () => {
      const missingKeys = enKeys.filter((key) => !localeKeySet.has(key));
      expect(missingKeys).toEqual([]);
    });

    it('should not contain extra keys that do not exist in en.json (warning)', () => {
      const extraKeys = localeKeys.filter((key) => !enKeySet.has(key));
      if (extraKeys.length > 0) {
        // Log a warning but do not fail the test
        // eslint-disable-next-line no-console
        console.warn(
          `[${locale}] has ${extraKeys.length} extra key(s) not in en.json:\n` +
            extraKeys.join('\n'),
        );
      }
      // This assertion always passes; extra keys are advisory only
      expect(true).toBe(true);
    });
  });
});
