import { JS_POST_MESSAGE_TO_PROVIDER } from './browserScripts';

const runInPage = (script: string, pageOrigin: string) => {
  const postMessage = jest.fn();
  const pageWindow = { location: { origin: pageOrigin }, postMessage };
  // eslint-disable-next-line no-new-func
  new Function('window', script)(pageWindow);
  return postMessage;
};

describe('JS_POST_MESSAGE_TO_PROVIDER', () => {
  const reply = { name: 'metamask-provider', data: { id: 1, result: ['0x1'] } };

  it('delivers the reply to a page on the bridge origin', () => {
    const postMessage = runInPage(
      JS_POST_MESSAGE_TO_PROVIDER(reply, 'https://globex-swap.example'),
      'https://globex-swap.example',
    );
    expect(postMessage).toHaveBeenCalledWith(
      reply,
      'https://globex-swap.example',
    );
  });

  it('does not run the page postMessage when the page origin differs', () => {
    // A page that replaced window.postMessage must not see replies meant for another origin
    const postMessage = runInPage(
      JS_POST_MESSAGE_TO_PROVIDER(reply, 'https://globex-swap.example'),
      'https://prize-drop.example',
    );
    expect(postMessage).not.toHaveBeenCalled();
  });

  it('keeps wildcard delivery unchanged', () => {
    const postMessage = runInPage(
      JS_POST_MESSAGE_TO_PROVIDER(reply, '*'),
      'https://prize-drop.example',
    );
    expect(postMessage).toHaveBeenCalledWith(reply, '*');
  });
});
