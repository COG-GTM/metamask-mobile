import { JS_POST_MESSAGE_TO_PROVIDER } from './browserScripts';

describe('JS_POST_MESSAGE_TO_PROVIDER', () => {
  it('injects the origin as an escaped string literal', () => {
    const postMessage = jest.fn();
    const origin = "https://x');globalThis.injected=true;('";
    const js = JS_POST_MESSAGE_TO_PROVIDER({ foo: 'bar' }, origin);

    // eslint-disable-next-line no-new-func
    new Function('window', js)({ postMessage });

    expect((globalThis as Record<string, unknown>).injected).toBeUndefined();
    expect(postMessage).toHaveBeenCalledTimes(1);
    expect(postMessage).toHaveBeenCalledWith({ foo: 'bar' }, origin);
  });
});
