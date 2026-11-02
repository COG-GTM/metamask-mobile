import { useRef } from 'react';
import { isEqual } from 'lodash';

/**
 * Returns the previously returned reference while `value` is deep-equal to it,
 * so callers can pass inline arrays (e.g. `[chainId]`) to memoized hooks.
 * Unlike an effect-based ref, the new value is returned on the same render it changes.
 * @param value - possibly unstable value
 * @returns a reference that only changes when the content changes
 */
export const useStableArray = <T>(value: T): T => {
  const ref = useRef(value);
  if (ref.current !== value && !isEqual(ref.current, value)) {
    ref.current = value;
  }
  return ref.current;
};
