import { getBrowserPermissionSubject } from './getBrowserPermissionSubject';

describe('getBrowserPermissionSubject', () => {
  it.each([
    ['https://dapp.example', 'dapp.example'],
    ['https://dapp.example/path?query=1#hash', 'dapp.example'],
    ['https://dapp.example:443/', 'dapp.example'],
    ['https://Dapp.Example', 'dapp.example'],
  ])('keeps the bare hostname for https page %s', (url, expected) => {
    expect(getBrowserPermissionSubject(url)).toBe(expected);
  });

  it.each([
    ['http://dapp.example', 'http://dapp.example'],
    ['http://dapp.example:80/path', 'http://dapp.example'],
    ['http://dapp.example:8080', 'http://dapp.example:8080'],
    ['https://dapp.example:8443/path', 'https://dapp.example:8443'],
  ])('uses the full origin for %s', (url, expected) => {
    expect(getBrowserPermissionSubject(url)).toBe(expected);
  });

  it('never returns the https subject for a non-https page on the same host', () => {
    const httpsSubject = getBrowserPermissionSubject('https://dapp.example');
    expect(getBrowserPermissionSubject('http://dapp.example')).not.toBe(
      httpsSubject,
    );
    expect(getBrowserPermissionSubject('https://dapp.example:8443')).not.toBe(
      httpsSubject,
    );
  });
});
