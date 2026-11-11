import parseRampIntent from './parseRampIntent';

describe('parseRampIntent', () => {
  it('returns undefined if pathParams do not contain necessary fields', () => {
    const pathParams = {};
    const result = parseRampIntent(pathParams);
    expect(result).toBeUndefined();
  });

  it('returns a RampIntent object if pathParams contain necessary fields', () => {
    const pathParams = {
      address: '0x1234567890',
      chainId: '1',
      amount: '10',
      currency: 'usd',
    };
    const result = parseRampIntent(pathParams);
    expect(result).toEqual({
      address: '0x1234567890',
      chainId: '1',
      amount: '10',
      currency: 'usd',
    });
  });

  it('defaults to chainId 1 if token address is defined but chainId is not', () => {
    const pathParams = {
      address: '0x1234567890',
      chainId: undefined,
      amount: '10',
      currency: 'usd',
    };
    const result = parseRampIntent(pathParams);
    expect(result).toEqual({
      address: '0x1234567890',
      chainId: '1',
      amount: '10',
      currency: 'usd',
    });
  });

  it('returns a RampIntent object with only defined fields', () => {
    const pathParams = {
      address: '0x1234567890',
      chainId: '76',
      amount: '10',
      currency: 'usd',
      extraneaous: 'field',
    };
    const result = parseRampIntent(pathParams);
    expect(result).toEqual({
      address: '0x1234567890',
      chainId: '76',
      amount: '10',
      currency: 'usd',
    });
  });

  it('returns a RampIntent object with only defined values', () => {
    const pathParams = { chainId: '56', amount: undefined, address: undefined };
    const result = parseRampIntent(pathParams);
    expect(result).toEqual({ chainId: '56' });
  });

  it.each(['0x89', '0', '01', '137abc', '-1', '1.5', ' 137', 'eip155:137'])(
    'drops a chainId that is not a decimal chain id (%s)',
    (chainId) => {
      expect(parseRampIntent({ chainId, amount: '10' })).toEqual({
        amount: '10',
      });
    },
  );

  it('does not default an invalid chainId to 1 when address is defined', () => {
    expect(
      parseRampIntent({ address: '0x1234567890', chainId: '0x89' }),
    ).toEqual({ address: '0x1234567890' });
  });

  it('returns undefined when the only param is an invalid chainId', () => {
    expect(parseRampIntent({ chainId: 'polygon' })).toBeUndefined();
  });
});
