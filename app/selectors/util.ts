import { isEqual } from 'lodash';
import { createSelectorCreator, defaultMemoize } from 'reselect';

export const createDeepEqualSelector = createSelectorCreator(
  defaultMemoize,
  isEqual,
);

/**
 * Reference-equality on inputs; deep-equality on the derived output so
 * subscribers keep a stable reference while the result is deeply unchanged.
 */
export const createOutputDeepEqualSelector = createSelectorCreator(
  defaultMemoize,
  { resultEqualityCheck: isEqual },
);
