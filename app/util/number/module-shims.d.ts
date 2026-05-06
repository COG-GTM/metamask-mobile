declare module '@metamask/ethjs-unit' {
  import type BN from 'bnjs4';
  function fromWei(weiInput: BN | string | number, unit?: string): string;
  function toWei(input: BN | string | number, unit?: string): BN;
  function numberToString(input: BN | string | number): string;
  const _default: {
    fromWei: typeof fromWei;
    toWei: typeof toWei;
    numberToString: typeof numberToString;
  };
  export = _default;
}

declare module 'number-to-bn' {
  import type BN from 'bnjs4';
  function numberToBN(input: BN | string | number): BN;
  export = numberToBN;
}
