import {
  buildWalletConnectPermissionSubject,
  findWalletConnectPermissionSubject,
  getWalletConnectVerification,
  isWalletConnectPermissionSubject,
  parseWalletConnectPermissionSubject,
} from './wc-verify';

const verifyContext = (
  validation: 'VALID' | 'INVALID' | 'UNKNOWN',
  origin: string,
  isScam?: boolean,
) => ({ verified: { validation, origin, verifyUrl: '', isScam } });

describe('getWalletConnectVerification', () => {
  it('treats a VALID attestation matching metadata.url as verified', () => {
    expect(
      getWalletConnectVerification(
        verifyContext('VALID', 'https://app.uniswap.org'),
        'https://app.uniswap.org/swap',
      ),
    ).toEqual({
      validation: 'VALID',
      isScam: false,
      isVerified: true,
      hostname: 'app.uniswap.org',
    });
  });

  it('treats UNKNOWN as unverified even though origin equals metadata.url', () => {
    expect(
      getWalletConnectVerification(
        verifyContext('UNKNOWN', 'https://app.uniswap.org'),
        'https://app.uniswap.org',
      ),
    ).toMatchObject({ isVerified: false, hostname: 'app.uniswap.org' });
  });

  it('treats a missing verify context as UNKNOWN', () => {
    expect(
      getWalletConnectVerification(undefined, 'https://app.uniswap.org'),
    ).toMatchObject({
      validation: 'UNKNOWN',
      isVerified: false,
      isScam: false,
    });
  });

  it('uses the attested origin for INVALID results', () => {
    expect(
      getWalletConnectVerification(
        verifyContext('INVALID', 'https://phisher.example'),
        'https://app.uniswap.org',
      ),
    ).toMatchObject({ isVerified: false, hostname: 'phisher.example' });
  });

  it('never marks a scam as verified', () => {
    expect(
      getWalletConnectVerification(
        verifyContext('VALID', 'https://app.uniswap.org', true),
        'https://app.uniswap.org',
      ),
    ).toMatchObject({ isScam: true, isVerified: false });
  });

  it('returns an empty hostname for unparsable metadata urls', () => {
    expect(getWalletConnectVerification(undefined, 'not a url').hostname).toBe(
      '',
    );
  });
});

describe('WalletConnect permission subjects', () => {
  it('round-trips through build and parse', () => {
    const subject = buildWalletConnectPermissionSubject({
      hostname: 'app.uniswap.org',
      isVerified: false,
      pairingTopic: 'abc123',
    });
    expect(subject).toBe('app.uniswap.org#wc-unverified-abc123');
    expect(parseWalletConnectPermissionSubject(subject)).toEqual({
      hostname: 'app.uniswap.org',
      isVerified: false,
      pairingTopic: 'abc123',
    });
  });

  it('never equals or parses back to a browser hostname subject', () => {
    const subject = buildWalletConnectPermissionSubject({
      hostname: 'app.uniswap.org',
      isVerified: true,
      pairingTopic: 'abc123',
    });
    expect(subject).not.toBe('app.uniswap.org');
    expect(isWalletConnectPermissionSubject('app.uniswap.org')).toBe(false);
    expect(isWalletConnectPermissionSubject(subject)).toBe(true);
  });

  it('finds the subject of a pairing', () => {
    const subjects = [
      'app.uniswap.org',
      'app.uniswap.org#wc-verified-pairing-a',
      'app.uniswap.org#wc-unverified-pairing-b',
    ];
    expect(findWalletConnectPermissionSubject(subjects, 'pairing-b')).toBe(
      'app.uniswap.org#wc-unverified-pairing-b',
    );
    expect(
      findWalletConnectPermissionSubject(subjects, 'pairing-c'),
    ).toBeUndefined();
  });
});
