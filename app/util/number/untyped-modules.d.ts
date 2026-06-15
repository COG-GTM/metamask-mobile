declare module '@metamask/ethjs-unit' {
  import BN from 'bnjs4';

  type EthjsUnitValue = number | string | BN;

  interface FromWeiOptions {
    pad?: boolean;
    commify?: boolean;
  }

  const convert: {
    unitMap: Record<string, string>;
    numberToString(arg: EthjsUnitValue): string;
    getValueOfUnit(unit?: string): BN;
    fromWei(weiInput: EthjsUnitValue, unit?: string, options?: FromWeiOptions): string;
    toWei(etherInput: EthjsUnitValue, unit?: string): BN;
  };

  export default convert;
}

declare module 'number-to-bn' {
  import BN from 'bnjs4';

  export default function numberToBN(value: number | string | BN): BN;
}
