import { getPermissionSubjectFromUrl } from './subject';

describe('getPermissionSubjectFromUrl', () => {
  it.each([
    ['https://dapp.example', 'dapp.example'],
    ['https://dapp.example/path?q=1#x', 'dapp.example'],
    ['https://dapp.example:443/', 'dapp.example'],
    ['dapp.example', 'dapp.example'],
  ])('keys default-port https %s by bare hostname', (url, expected) => {
    expect(getPermissionSubjectFromUrl(url)).toBe(expected);
  });

  it.each([
    ['http://dapp.example', 'http://dapp.example'],
    ['http://dapp.example/login', 'http://dapp.example'],
    ['http://dapp.example:8080/x', 'http://dapp.example:8080'],
    ['https://dapp.example:8443/x', 'https://dapp.example:8443'],
    ['http://localhost:3000', 'http://localhost:3000'],
  ])('keys %s by its full origin', (url, expected) => {
    expect(getPermissionSubjectFromUrl(url)).toBe(expected);
  });

  it('gives http, https and other ports of one hostname distinct subjects', () => {
    const subjects = new Set(
      [
        'https://dapp.example',
        'http://dapp.example',
        'https://dapp.example:8443',
        'http://dapp.example:8443',
      ].map(getPermissionSubjectFromUrl),
    );
    expect(subjects.size).toBe(4);
  });

  it('returns the input when it cannot be parsed', () => {
    expect(getPermissionSubjectFromUrl('')).toBe('');
    expect(getPermissionSubjectFromUrl('not a url')).toBe('not a url');
  });
});
