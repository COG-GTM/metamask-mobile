/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react';

/**
 * Represents the result of an asynchronous function where errors
 * are thrown to be handled by an error boundary.
 */


// success

/**
 * Represents the result of an asynchronous function with the
 * possibility of an error
 */


// error

/**
 * Hook that executes an asynchronous function and returns its result
 * or an error (errors are caught and returned as part of the result).
 *
 * @param asyncFn
 * @param dependencies
 */
export function useAsyncResult(
asyncFn,
dependencies = [])
{
  const [result, setResult] = useState({
    pending: true
  });

  useEffect(() => {
    setResult({ pending: true });
    let cancelled = false;
    asyncFn().
    then((value) => {
      if (!cancelled) {
        setResult({ pending: false, value });
      }
    }).
    catch((error) => {
      if (!cancelled) {
        setResult({ pending: false, error: error });
      }
    });
    return () => {
      cancelled = true;
    };
  }, dependencies);

  return result;
}

/**
 * Hook that executes an asynchronous function and returns its result
 * or throws an error to be handled by an error boundary.
 *
 * @param asyncFn
 * @param deps
 * @returns
 */
export function useAsyncResultOrThrow(
asyncFn,
deps = [])
{
  const result = useAsyncResult(asyncFn, deps);

  if (result.error) {
    // Error is thrown from render phase to be handled by an error boundary.
    throw result.error;
  }

  return result;
}