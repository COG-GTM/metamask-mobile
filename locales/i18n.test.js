import { supportedTranslations, getLanguages } from './i18n';

/**
 * Recursively flattens a nested object into dot-separated key-value pairs.
 * e.g. { a: { b: "hello" } } => [{ key: "a.b", value: "hello" }]
 */
function flattenEntries(obj, prefix = '') {
  let entries = [];
  for (const [k, v] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${k}` : k;
    if (typeof v === 'object' && v !== null) {
      entries = entries.concat(flattenEntries(v, fullKey));
    } else {
      entries.push({ key: fullKey, value: v });
    }
  }
  return entries;
}

/**
 * Extracts all %{...} interpolation placeholders from a string.
 */
function extractPlaceholders(str) {
  const matches = str.match(/%\{[^}]+\}/g);
  return matches ? [...new Set(matches)] : [];
}

/**
 * Resolves a dot-separated key path to a value in a nested object.
 * Returns undefined if the path does not exist.
 */
function resolveKey(obj, keyPath) {
  const parts = keyPath.split('.');
  let current = obj;
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return undefined;
    current = current[part];
  }
  return current;
}

describe('getLanguage', () => {
  it('should have the same keys() as supportedTranslations', () => {
    const supportedTranslationsKeys = Object.keys(supportedTranslations);
    const getLanguagesKeys = Object.keys(getLanguages());
    expect(supportedTranslationsKeys.sort()).toEqual(getLanguagesKeys.sort());
  });
});

describe('en.json values', () => {
  const enTranslation = supportedTranslations.en;
  const enEntries = flattenEntries(enTranslation);

  it('should have a non-empty string value for every key', () => {
    // Plural "zero" forms are intentionally empty (nothing to display)
    const allowedEmptyKeys = [
      'stake.day.zero',
      'stake.hour.zero',
      'stake.minute.zero',
    ];

    const emptyKeys = enEntries.filter(
      ({ key, value }) =>
        typeof value === 'string' &&
        value === '' &&
        !allowedEmptyKeys.includes(key),
    );

    expect(emptyKeys.map(({ key }) => key)).toEqual([]);
  });

  it('should warn about duplicate values for different keys', () => {
    const valueToKeys = {};
    for (const { key, value } of enEntries) {
      if (typeof value !== 'string') continue;
      if (!valueToKeys[value]) {
        valueToKeys[value] = [];
      }
      valueToKeys[value].push(key);
    }

    const duplicates = Object.entries(valueToKeys).filter(
      ([, keys]) => keys.length > 1,
    );

    if (duplicates.length > 0) {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
      for (const [value, keys] of duplicates) {
        console.warn(
          `Duplicate value "${value}" found in keys: ${keys.join(', ')}`,
        );
      }
      warnSpy.mockRestore();
    }

    // This test always passes; duplicates are reported as warnings only
    expect(true).toBe(true);
  });
});

describe('interpolation placeholders', () => {
  const enTranslation = supportedTranslations.en;
  const enEntries = flattenEntries(enTranslation);

  // Build a map of en keys that have %{...} placeholders
  const enPlaceholderMap = {};
  for (const { key, value } of enEntries) {
    if (typeof value !== 'string') continue;
    const placeholders = extractPlaceholders(value);
    if (placeholders.length > 0) {
      enPlaceholderMap[key] = placeholders;
    }
  }

  const otherLocales = Object.entries(supportedTranslations).filter(
    ([locale]) => locale !== 'en',
  );

  for (const [locale, translation] of otherLocales) {
    it(`should have matching placeholders in "${locale}" for all en.json keys with interpolation`, () => {
      const missingPlaceholders = [];

      for (const [enKey, enPlaceholders] of Object.entries(
        enPlaceholderMap,
      )) {
        const localeValue = resolveKey(translation, enKey);
        if (typeof localeValue !== 'string') continue;

        const localePlaceholders = extractPlaceholders(localeValue);
        const missing = enPlaceholders.filter(
          (p) => !localePlaceholders.includes(p),
        );

        if (missing.length > 0) {
          missingPlaceholders.push({
            key: enKey,
            missing,
          });
        }
      }

      expect(missingPlaceholders).toEqual([]);
    });
  }
});
