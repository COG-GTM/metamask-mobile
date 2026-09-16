declare module '@metamask/ethjs-unit' {
  type BN = import('bnjs4');

  type NumberInput = string | number | { toString(base?: number): string };

  interface FromWeiOptions {
    pad?: boolean;
    commify?: boolean;
  }

  const convert: {
    unitMap: Record<string, string>;
    numberToString(arg: NumberInput): string;
    getValueOfUnit(unitInput?: string): BN;
    fromWei(
      weiInput: NumberInput,
      unit: string,
      options?: FromWeiOptions,
    ): string;
    toWei(etherInput: NumberInput, unit: string): BN;
  };
  export default convert;
}

declare module 'number-to-bn' {
  function numberToBN(
    arg: string | number | { toString(base?: number): string },
  ): import('bnjs4');
  export default numberToBN;
}
