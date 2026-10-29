import {
  act,
  renderHook as renderHookRNTL,
  waitFor,
} from '@testing-library/react-native';

type RenderHookOptions<Props> = Parameters<
  typeof renderHookRNTL<unknown, Props>
>[1];

/**
 * React 19 compatible replacement for `@testing-library/react-hooks` `renderHook`,
 * which no longer re-renders on async state updates. Adds `waitForNextUpdate`.
 */
export function renderHook<Result, Props>(
  callback: (props: Props) => Result,
  options?: RenderHookOptions<Props>,
) {
  let renderCount = 0;
  const utils = renderHookRNTL((props: Props) => {
    renderCount += 1;
    return callback(props);
  }, options);

  const waitForNextUpdate = async ({ timeout = 1000 } = {}) => {
    const initialRenderCount = renderCount;
    await waitFor(
      () => {
        if (renderCount === initialRenderCount) {
          throw new Error(`Timed out in waitForNextUpdate after ${timeout}ms.`);
        }
      },
      { timeout },
    );
  };

  return { ...utils, waitForNextUpdate };
}

export { act, waitFor };
