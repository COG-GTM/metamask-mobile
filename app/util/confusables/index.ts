// @ts-expect-error unicode-confusables has no type declarations
import { confusables } from 'unicode-confusables';
import { strings } from '../../../locales/i18n';
// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports, import/no-commonjs
const confusablesMap: Record<string, string> = require('unicode-confusables/data/confusables.json');

export const collectConfusables = (ensName: string): string[] => {
  const key = 'similarTo';
  const collection = confusables(ensName).reduce(
    (total: string[], current: { point: string; [key: string]: string }) => (key in current ? [...total, current.point] : total),
    [] as string[],
  );
  return collection;
};

const zeroWidthPoints = new Set([
  '\u200b', // zero width space
  '\u200c', // zero width non-joiner
  '\u200d', // zero width joiner
  '\ufeff', // zero width no-break space
  '\u2028', // line separator
  '\u2029', // paragraph separator,
]);

export const hasZeroWidthPoints = (char: string): boolean => zeroWidthPoints.has(char);

export const getConfusablesExplanations = (confusableCollection: string[]): string[] => [
  ...new Set(
    confusableCollection.map((key) => {
      const value = confusablesMap[key];
      return hasZeroWidthPoints(key)
        ? strings('transaction.contains_zero_width')
        : `'${key}' ${strings('transaction.similar_to')} '${value}'`;
    }),
  ),
];
