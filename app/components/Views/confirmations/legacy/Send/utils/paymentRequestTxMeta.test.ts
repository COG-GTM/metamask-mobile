import {
  buildSendEthTxMeta,
  buildSendTokenTxMeta,
  InvalidPaymentRequestError,
  parsePaymentRequestAmount,
} from './paymentRequestTxMeta';

const RECIPIENT = '0x8e23ee67d1332ad560396262c48ffbb01f93d052';
const TOKEN = {
  address: '0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7',
  decimals: 18,
  symbol: 'TST',
};

// transfer(address,uint256): 4-byte selector + two 32-byte words
const decodeAmount = (data: string) => ({
  toAddress: `0x${data.slice(34, 74)}`,
  amount: BigInt(`0x${data.slice(74, 138)}`).toString(),
});

describe('parsePaymentRequestAmount', () => {
  it.each([undefined, null, ''])('returns 0 for missing amount %p', (v) => {
    expect(parsePaymentRequestAmount(v).toFixed()).toBe('0');
  });

  it.each([
    ['1000000000000000000', '1000000000000000000'],
    ['1e18', '1000000000000000000'],
    ['1.23456789012345678901234e+23', '123456789012345678901234'],
    [42, '42'],
  ])('parses %p exactly', (input, expected) => {
    expect(parsePaymentRequestAmount(input).toFixed()).toBe(expected);
  });

  it.each([
    ['.5e18', '500000000000000000'],
    ['5.e1', '50'],
  ])('accepts decimal notation %p', (input, expected) => {
    expect(parsePaymentRequestAmount(input).toFixed()).toBe(expected);
  });

  it.each([
    '-1',
    '1.5',
    `1.${'0'.repeat(36)}1`,
    '0x10',
    'abc',
    'Infinity',
    'NaN',
    {},
    '1e78',
  ])('rejects %p', (input) => {
    expect(() => parsePaymentRequestAmount(input)).toThrow(
      InvalidPaymentRequestError,
    );
  });

  it('accepts the max uint256', () => {
    const max =
      '115792089237316195423570985008687907853269984665640564039457584007913129639935';
    expect(parsePaymentRequestAmount(max).toFixed()).toBe(max);
    expect(() =>
      parsePaymentRequestAmount(
        '115792089237316195423570985008687907853269984665640564039457584007913129639936',
      ),
    ).toThrow(InvalidPaymentRequestError);
  });
});

describe('buildSendEthTxMeta', () => {
  it('converts value to hex and readableValue in ETH', () => {
    expect(
      buildSendEthTxMeta({ to: RECIPIENT, value: '2014000000000000000' }),
    ).toEqual({
      symbol: 'ETH',
      assetType: 'ETH',
      paymentRequest: true,
      selectedAsset: { symbol: 'ETH', isETH: true },
      to: RECIPIENT,
      transactionTo: RECIPIENT,
      value: '0x1bf32a5451a30000',
      transactionValue: '0x1bf32a5451a30000',
      readableValue: '2.014',
    });
  });

  it('keeps full precision for values above Number.MAX_SAFE_INTEGER', () => {
    const txMeta = buildSendEthTxMeta({
      to: RECIPIENT,
      value: '123456789012345678901234',
    });
    expect(BigInt(txMeta.value as string).toString()).toBe(
      '123456789012345678901234',
    );
    expect(txMeta.readableValue).toBe('123456.789012345678901234');
  });

  it('omits the value fields when no value is given', () => {
    const txMeta = buildSendEthTxMeta({ to: RECIPIENT });
    expect(txMeta).not.toHaveProperty('value');
    expect(txMeta).not.toHaveProperty('readableValue');
  });

  it('rejects a fractional wei value', () => {
    expect(() => buildSendEthTxMeta({ to: RECIPIENT, value: '0.5' })).toThrow(
      InvalidPaymentRequestError,
    );
  });
});

describe('buildSendTokenTxMeta', () => {
  it('encodes uint256 as hex transfer data and uses token decimals', () => {
    const txMeta = buildSendTokenTxMeta({
      selectedAsset: TOKEN,
      to: RECIPIENT,
      ensRecipient: 'alice.eth',
      uint256: '1500000000000000000',
    });
    expect(txMeta).toMatchObject({
      assetType: 'ERC20',
      paymentRequest: true,
      selectedAsset: TOKEN,
      ensRecipient: 'alice.eth',
      to: TOKEN.address,
      transactionTo: RECIPIENT,
      value: '0x0',
      readableValue: '1.5',
    });
    expect(txMeta.data.startsWith('0xa9059cbb')).toBe(true);
    expect(txMeta.data).toContain('14d1120d7b160000');
    expect(decodeAmount(txMeta.data)).toEqual({
      toAddress: RECIPIENT,
      amount: '1500000000000000000',
    });
  });

  it('encodes the exact amount for scientific-notation uint256', () => {
    const txMeta = buildSendTokenTxMeta({
      selectedAsset: TOKEN,
      to: RECIPIENT,
      uint256: '1.23456789012345678901234e+23',
    });
    expect(decodeAmount(txMeta.data).amount).toBe('123456789012345678901234');
    expect(txMeta.readableValue).toBe('123456.789012345678901234');
  });

  it('uses non-18 token decimals for readableValue', () => {
    const txMeta = buildSendTokenTxMeta({
      selectedAsset: { ...TOKEN, decimals: 6 },
      to: RECIPIENT,
      uint256: '2500000',
    });
    expect(txMeta.readableValue).toBe('2.5');
    expect(decodeAmount(txMeta.data).amount).toBe('2500000');
  });

  it('defaults to a zero transfer when uint256 is missing', () => {
    const txMeta = buildSendTokenTxMeta({
      selectedAsset: TOKEN,
      to: RECIPIENT,
    });
    expect(txMeta.readableValue).toBe('0');
    expect(decodeAmount(txMeta.data).amount).toBe('0');
  });

  it.each([undefined, null, '', 'abc', -1, 1.5])(
    'rejects invalid token decimals %p',
    (decimals) => {
      expect(() =>
        buildSendTokenTxMeta({
          selectedAsset: {
            ...TOKEN,
            decimals: decimals as unknown as number,
          },
          to: RECIPIENT,
          uint256: '1',
        }),
      ).toThrow(InvalidPaymentRequestError);
    },
  );

  it.each(['-5', '1.5'])('rejects invalid uint256 %p', (uint256) => {
    expect(() =>
      buildSendTokenTxMeta({ selectedAsset: TOKEN, to: RECIPIENT, uint256 }),
    ).toThrow(InvalidPaymentRequestError);
  });
});
