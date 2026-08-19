import { JS_POST_MESSAGE_TO_PROVIDER } from './browserScripts';

describe('JS_POST_MESSAGE_TO_PROVIDER', () => {
  it('posts the message to the given origin', () => {
    const script = JS_POST_MESSAGE_TO_PROVIDER(
      { name: 'metamask-provider' },
      'https://example.com',
    );
    expect(script).toContain(
      'window.postMessage({"name":"metamask-provider"}, "https://example.com");',
    );
  });

  it('does not let a malicious origin inject code', () => {
    const script = JS_POST_MESSAGE_TO_PROVIDER(
      {},
      "https://evil.xyz/#');alert(document.cookie);//",
    );
    expect(script).toContain(
      'window.postMessage({}, "https://evil.xyz/#\');alert(document.cookie);//");',
    );
  });

  it('does not let a malicious message payload inject code', () => {
    const script = JS_POST_MESSAGE_TO_PROVIDER(
      { data: "</script>'+alert(1)+'\u2028" },
      'https://example.com',
    );
    expect(script).not.toContain('</script>');
    expect(script).not.toContain('\u2028');
  });
});
