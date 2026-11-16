import formattedDeeplinkParsedValue from './formattedDeeplinkParsedValue';

describe('formattedDeeplinkParsedValue', () => {
  it('should format the value', () => {
    expect(formattedDeeplinkParsedValue('1.234e+17')).toEqual(
      '123400000000000000',
    );
    expect(formattedDeeplinkParsedValue('1e+21')).toEqual(
      '1000000000000000000000',
    );
    expect(formattedDeeplinkParsedValue('1.4e+18')).toEqual(
      '1400000000000000000',
    );
    expect(formattedDeeplinkParsedValue('1.6e+21')).toEqual(
      '1600000000000000000000',
    );
    expect(formattedDeeplinkParsedValue('4.2e+17')).toEqual(
      '420000000000000000',
    );
  });

  it('keeps every digit of values above Number.MAX_SAFE_INTEGER', () => {
    expect(
      formattedDeeplinkParsedValue('1.23456789012345678901234e+23'),
    ).toEqual('123456789012345678901234');
    expect(formattedDeeplinkParsedValue('12345678901234567891')).toEqual(
      '12345678901234567891',
    );
  });
});
