import { confusables } from 'unicode-confusables';
import { strings } from '../../../locales/i18n';
import confusablesMap from 'unicode-confusables/data/confusables.json';

interface ConfusablePoint {
  point: string;
  similarTo?: string;
}

// Call sites collect the result into loosely typed state, so the result is
// left untyped.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const collectConfusables = (ensName: string): any => {
  const key = 'similarTo';
  const collection = (confusables(ensName) as ConfusablePoint[]).reduce(
    (total: string[], current) =>
      key in current ? [...total, current.point] : total,
    [],
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

export const hasZeroWidthPoints = (char: string) => zeroWidthPoints.has(char);

export const getConfusablesExplanations = (confusableCollection: string[]) => [
  ...new Set(
    confusableCollection.map((key: string) => {
      const value = (confusablesMap as Record<string, string>)[key];
      return hasZeroWidthPoints(key)
        ? strings('transaction.contains_zero_width')
        : `'${key}' ${strings('transaction.similar_to')} '${value}'`;
    }),
  ),
];
