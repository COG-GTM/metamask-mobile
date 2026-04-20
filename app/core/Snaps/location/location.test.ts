import {
  HttpLocation,
  LocalLocation,
} from '@metamask/snaps-controllers';
import { NpmLocation } from './npm';
import { detectSnapLocation } from './location';

describe('detectSnapLocation', () => {
  it('returns an NpmLocation for npm: URIs', () => {
    const loc = detectSnapLocation('npm:@metamask/example-snap');
    expect(loc).toBeInstanceOf(NpmLocation);
  });

  it('accepts a URL instance', () => {
    const url = new URL('npm:@metamask/example-snap');
    const loc = detectSnapLocation(url);
    expect(loc).toBeInstanceOf(NpmLocation);
  });

  it('throws if local snaps are not allowed', () => {
    expect(() => detectSnapLocation('local:http://localhost/snap')).toThrow(
      'Fetching local snaps is disabled.',
    );
  });

  it('returns a LocalLocation when local is allowed', () => {
    const loc = detectSnapLocation('local:http://localhost/snap', {
      allowLocal: true,
    });
    expect(loc).toBeInstanceOf(LocalLocation);
  });

  it('throws if http/https are not allowed', () => {
    expect(() => detectSnapLocation('https://example.com/snap')).toThrow(
      'Fetching snaps through http/https is disabled.',
    );
    expect(() => detectSnapLocation('http://example.com/snap')).toThrow(
      'Fetching snaps through http/https is disabled.',
    );
  });

  it('returns an HttpLocation when http/https are allowed', () => {
    const loc = detectSnapLocation('https://example.com/snap', {
      allowHttp: true,
    });
    expect(loc).toBeInstanceOf(HttpLocation);
  });

  it('throws for unrecognized protocols', () => {
    expect(() => detectSnapLocation('ftp://example.com/snap')).toThrow(
      /Unrecognized "ftp:" snap location protocol\./,
    );
  });
});
