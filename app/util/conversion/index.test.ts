import BigNumber from 'bignumber.js';
import {
  addCurrencies,
  conversionGreaterThan,
  conversionGTE,
  conversionLessThan,
  conversionLTE,
  conversionMax,
  conversionUtil,
  multiplyCurrencies,
  subtractCurrencies,
  toNegative,
} from '.';

describe('conversion utils', () => {
  describe('addCurrencies()', () => {
    it('add whole numbers', () => {
      const result = addCurrencies(3, 9, {
        aBase: 10,
        bBase: 10,
      }) as BigNumber;
      expect(result.toNumber()).toStrictEqual(12);
    });

    it('add decimals', () => {
      const result = addCurrencies(1.3, 1.9, {
        aBase: 10,
        bBase: 10,
      }) as BigNumber;
      expect(result.toNumber()).toStrictEqual(3.2);
    });

    it('add repeating decimals', () => {
      const result = addCurrencies(1 / 3, 1 / 9, {
        aBase: 10,
        bBase: 10,
      }) as BigNumber;
      expect(result.toNumber()).toStrictEqual(0.4444444444444444);
    });
  });

  describe('conversionUtil', () => {
    it('returns expected types', () => {
      const conv1 = conversionUtil(1000000000000000000, {
        fromNumericBase: 'dec',
        toNumericBase: 'hex',
        fromDenomination: undefined,
        toDenomination: undefined,
        numberOfDecimals: undefined,
        conversionRate: undefined,
        invertConversionRate: undefined,
      });
      const conv2 = conversionUtil(1, {
        fromNumericBase: 'dec',
        fromDenomination: 'ETH',
        toDenomination: 'WEI',
        numberOfDecimals: undefined,
        conversionRate: undefined,
        invertConversionRate: undefined,
        toNumericBase: undefined,
      });
      expect(typeof conv1 === 'string').toStrictEqual(true);
      expect(conv2 instanceof BigNumber).toStrictEqual(true);
    });
    it('converts from dec to hex', () => {
      expect(
        conversionUtil('1000000000000000000', {
          fromNumericBase: 'dec',
          toNumericBase: 'hex',
          fromDenomination: undefined,
          toDenomination: undefined,
          numberOfDecimals: undefined,
          conversionRate: undefined,
          invertConversionRate: undefined,
        }),
      ).toStrictEqual('de0b6b3a7640000');
      expect(
        conversionUtil('1500000000000000000', {
          fromNumericBase: 'dec',
          toNumericBase: 'hex',
          fromDenomination: undefined,
          toDenomination: undefined,
          numberOfDecimals: undefined,
          conversionRate: undefined,
          invertConversionRate: undefined,
        }),
      ).toStrictEqual('14d1120d7b160000');
    });
    it('converts hex formatted numbers to dec', () => {
      expect(
        conversionUtil('0xde0b6b3a7640000', {
          fromNumericBase: 'hex',
          toNumericBase: 'dec',
          fromDenomination: undefined,
          toDenomination: undefined,
          numberOfDecimals: undefined,
          conversionRate: undefined,
          invertConversionRate: undefined,
        }),
      ).toStrictEqual('1000000000000000000');
      expect(
        conversionUtil('0x14d1120d7b160000', {
          fromNumericBase: 'hex',
          toNumericBase: 'dec',
          fromDenomination: undefined,
          toDenomination: undefined,
          numberOfDecimals: undefined,
          conversionRate: undefined,
          invertConversionRate: undefined,
        }),
      ).toStrictEqual('1500000000000000000');
    });
    it('converts WEI to ETH', () => {
      expect(
        conversionUtil('0xde0b6b3a7640000', {
          fromNumericBase: 'hex',
          toNumericBase: 'dec',
          fromDenomination: 'WEI',
          toDenomination: 'ETH',
          numberOfDecimals: undefined,
          conversionRate: undefined,
          invertConversionRate: undefined,
        }),
      ).toStrictEqual('1');
      expect(
        conversionUtil('0x14d1120d7b160000', {
          fromNumericBase: 'hex',
          toNumericBase: 'dec',
          fromDenomination: 'WEI',
          toDenomination: 'ETH',
          numberOfDecimals: undefined,
          conversionRate: undefined,
          invertConversionRate: undefined,
        }),
      ).toStrictEqual('1.5');
    });
    it('converts ETH to WEI', () => {
      expect(
        (
          conversionUtil('1', {
            fromNumericBase: 'dec',
            fromDenomination: 'ETH',
            toDenomination: 'WEI',
            toNumericBase: undefined,
            numberOfDecimals: undefined,
            conversionRate: undefined,
            invertConversionRate: undefined,
          }) as BigNumber
        ).toNumber(),
      ).toStrictEqual(1000000000000000000);
      expect(
        (
          conversionUtil('1.5', {
            fromNumericBase: 'dec',
            fromDenomination: 'ETH',
            toDenomination: 'WEI',
            toNumericBase: undefined,
            numberOfDecimals: undefined,
            conversionRate: undefined,
            invertConversionRate: undefined,
          }) as BigNumber
        ).toNumber(),
      ).toStrictEqual(1500000000000000000);
    });
    it('converts ETH to GWEI', () => {
      expect(
        (
          conversionUtil('1', {
            fromNumericBase: 'dec',
            fromDenomination: 'ETH',
            toDenomination: 'GWEI',
            toNumericBase: undefined,
            numberOfDecimals: undefined,
            conversionRate: undefined,
            invertConversionRate: undefined,
          }) as BigNumber
        ).toNumber(),
      ).toStrictEqual(1000000000);
      expect(
        (
          conversionUtil('1.5', {
            fromNumericBase: 'dec',
            fromDenomination: 'ETH',
            toDenomination: 'GWEI',
            toNumericBase: undefined,
            numberOfDecimals: undefined,
            conversionRate: undefined,
            invertConversionRate: undefined,
          }) as BigNumber
        ).toNumber(),
      ).toStrictEqual(1500000000);
    });
    it('converts ETH to USD', () => {
      expect(
        conversionUtil('1', {
          fromNumericBase: 'dec',
          toNumericBase: 'dec',
          //@ts-expect-error - conversion.js file needs conversion to ts file
          toCurrency: 'usd',
          conversionRate: 468.58,
          numberOfDecimals: 2,
          fromDenomination: undefined,
          toDenomination: undefined,
          invertConversionRate: undefined,
        }),
      ).toStrictEqual('468.58');
      expect(
        conversionUtil('1.5', {
          fromNumericBase: 'dec',
          toNumericBase: 'dec',
          //@ts-expect-error - conversion.js file needs conversion to ts file
          toCurrency: 'usd',
          conversionRate: 468.58,
          numberOfDecimals: 2,
          fromDenomination: undefined,
          toDenomination: undefined,
          invertConversionRate: undefined,
        }),
      ).toStrictEqual('702.87');
    });
    it('converts USD to ETH', () => {
      expect(
        conversionUtil('468.58', {
          fromNumericBase: 'dec',
          toNumericBase: 'dec',
          //@ts-expect-error - conversion.js file needs conversion to ts file
          toCurrency: 'usd',
          conversionRate: 468.58,
          numberOfDecimals: 2,
          invertConversionRate: true,
          fromDenomination: undefined,
          toDenomination: undefined,
        }),
      ).toStrictEqual('1');
      expect(
        conversionUtil('702.87', {
          fromNumericBase: 'dec',
          toNumericBase: 'dec',
          //@ts-expect-error - conversion.js file needs conversion to ts file
          toCurrency: 'usd',
          conversionRate: 468.58,
          numberOfDecimals: 2,
          invertConversionRate: true,
          fromDenomination: undefined,
          toDenomination: undefined,
        }),
      ).toStrictEqual('1.5');
    });
  });

  describe('subtractCurrencies()', () => {
    it('subtracts decimal values', () => {
      const result = subtractCurrencies(9, 3, {
        aBase: 10,
        bBase: 10,
      }) as BigNumber;
      expect(result.toNumber()).toStrictEqual(6);
    });

    it('returns a negative result when b is greater than a', () => {
      const result = subtractCurrencies(3, 9, {
        aBase: 10,
        bBase: 10,
      }) as BigNumber;
      expect(result.toNumber()).toStrictEqual(-6);
    });

    it('subtracts hex values into a hex output', () => {
      expect(
        subtractCurrencies('0x5208', '0x2710', {
          aBase: 16,
          bBase: 16,
          toNumericBase: 'hex',
        }),
      ).toStrictEqual('2af8');
    });

    it('subtracts a decimal from a hex value into a decimal output', () => {
      expect(
        subtractCurrencies('0xde0b6b3a7640000', '500000000000000000', {
          aBase: 16,
          bBase: 10,
          toNumericBase: 'dec',
          fromDenomination: 'WEI',
          toDenomination: 'ETH',
        }),
      ).toStrictEqual('0.5');
    });

    it('returns a negative hex result on underflow', () => {
      expect(
        subtractCurrencies('0x1', '0x2', {
          aBase: 16,
          bBase: 16,
          toNumericBase: 'hex',
        }),
      ).toStrictEqual('-1');
    });

    it('throws when aBase or bBase is invalid', () => {
      expect(() => subtractCurrencies(1, 1, { aBase: 10 })).toThrow(
        'Must specify valid aBase and bBase',
      );
      expect(() => subtractCurrencies(1, 1, { aBase: 1, bBase: 10 })).toThrow(
        'Must specify valid aBase and bBase',
      );
    });
  });

  describe('multiplyCurrencies()', () => {
    it('multiplies hex by hex into a hex output (gas total)', () => {
      // 21000 gas * 1 gwei = 21000 gwei = 0x1319718a5000 wei
      expect(
        multiplyCurrencies('0x5208', '0x3b9aca00', {
          multiplicandBase: 16,
          multiplierBase: 16,
          toNumericBase: 'hex',
        }),
      ).toStrictEqual('1319718a5000');
    });

    it('multiplies hex by dec into a hex output (gas price bump)', () => {
      // 10 gwei * 1.1 = 11 gwei
      expect(
        multiplyCurrencies('0x2540be400', 1.1, {
          multiplicandBase: 16,
          multiplierBase: 10,
          toNumericBase: 'hex',
        }),
      ).toStrictEqual('28fa6ae00');
    });

    it('applies the multiplier in its own base', () => {
      // 0x10 * 10 (dec) = 160, while 0x10 * 0x10 = 256
      expect(
        multiplyCurrencies('0x10', '10', {
          multiplicandBase: 16,
          multiplierBase: 10,
          toNumericBase: 'dec',
        }),
      ).toStrictEqual('160');
      expect(
        multiplyCurrencies('0x10', '10', {
          multiplicandBase: 16,
          multiplierBase: 16,
          toNumericBase: 'dec',
        }),
      ).toStrictEqual('256');
    });

    it('propagates denomination options to the converter', () => {
      expect(
        multiplyCurrencies('0x5208', '0x3b9aca00', {
          multiplicandBase: 16,
          multiplierBase: 16,
          toNumericBase: 'dec',
          fromDenomination: 'WEI',
          toDenomination: 'GWEI',
        }),
      ).toStrictEqual('21000');
    });

    it('returns a BigNumber when no output base is given', () => {
      const result = multiplyCurrencies(3, 4, {
        multiplicandBase: 10,
        multiplierBase: 10,
      });
      expect(result instanceof BigNumber).toStrictEqual(true);
      expect((result as BigNumber).toNumber()).toStrictEqual(12);
    });

    it('throws when multiplicandBase or multiplierBase is invalid', () => {
      expect(() => multiplyCurrencies(1, 1, { multiplicandBase: 16 })).toThrow(
        'Must specify valid multiplicandBase and multiplierBase',
      );
      expect(() =>
        multiplyCurrencies(1, 1, { multiplicandBase: 16, multiplierBase: 0 }),
      ).toThrow('Must specify valid multiplicandBase and multiplierBase');
    });
  });

  describe('toNegative()', () => {
    it('negates a hex value', () => {
      expect(
        toNegative('0x10', {
          multiplicandBase: 16,
          multiplierBase: 10,
          toNumericBase: 'dec',
        }),
      ).toStrictEqual('-16');
    });

    it('negates a negative decimal value', () => {
      const result = toNegative(-5, {
        multiplicandBase: 10,
        multiplierBase: 10,
      }) as BigNumber;
      expect(result.toNumber()).toStrictEqual(5);
    });
  });

  describe('comparison helpers', () => {
    const hex = (value: string) => ({ value, fromNumericBase: 'hex' });

    it('conversionGreaterThan compares hex values', () => {
      expect(conversionGreaterThan(hex('0x10'), hex('0xf'))).toStrictEqual(
        true,
      );
      expect(conversionGreaterThan(hex('0xf'), hex('0x10'))).toStrictEqual(
        false,
      );
      expect(conversionGreaterThan(hex('0x10'), hex('0x10'))).toStrictEqual(
        false,
      );
    });

    it('conversionGreaterThan honours denominations', () => {
      expect(
        conversionGreaterThan(
          { value: '1', fromNumericBase: 'dec', fromDenomination: 'ETH' },
          {
            value: '0xde0b6b3a763ffff',
            fromNumericBase: 'hex',
            fromDenomination: 'WEI',
          },
        ),
      ).toStrictEqual(true);
    });

    it('conversionLessThan compares hex values', () => {
      expect(conversionLessThan(hex('0xf'), hex('0x10'))).toStrictEqual(true);
      expect(conversionLessThan(hex('0x10'), hex('0x10'))).toStrictEqual(false);
    });

    it('conversionGTE compares hex values', () => {
      expect(conversionGTE(hex('0x10'), hex('0xf'))).toStrictEqual(true);
      expect(conversionGTE(hex('0x10'), hex('0x10'))).toStrictEqual(true);
      expect(conversionGTE(hex('0xf'), hex('0x10'))).toStrictEqual(false);
    });

    it('conversionLTE compares hex values', () => {
      expect(conversionLTE(hex('0xf'), hex('0x10'))).toStrictEqual(true);
      expect(conversionLTE(hex('0x10'), hex('0x10'))).toStrictEqual(true);
      expect(conversionLTE(hex('0x10'), hex('0xf'))).toStrictEqual(false);
    });

    it('conversionMax returns the larger original value', () => {
      expect(conversionMax(hex('0x10'), hex('0xf'))).toStrictEqual('0x10');
      expect(conversionMax(hex('0xf'), hex('0x10'))).toStrictEqual('0x10');
    });

    it('conversionMax returns the second value when equal', () => {
      expect(conversionMax(hex('0x10'), hex('0x010'))).toStrictEqual('0x010');
    });
  });
});
