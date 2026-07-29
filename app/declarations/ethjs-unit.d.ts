// `@metamask/ethjs-unit` and `number-to-bn` are published without type
// declarations, so their (small) public surfaces are declared here.
declare module '@metamask/ethjs-unit' {
  import type BN from 'bnjs4';

  /**
   * Anything the library accepts as a numeric value: a string, a number or a
   * big-number instance (any of the `bn.js` flavours in the dependency tree).
   */
  type EthjsNumericValue =
    | string
    | number
    | { toString(base?: number): string };

  export function toWei(value: EthjsNumericValue, unit?: string): BN;
  export function fromWei(value: EthjsNumericValue, unit?: string): string;
  export function numberToString(value: EthjsNumericValue): string;
  export function getValueOfUnit(unit?: string): BN;

  const ethjsUnit: {
    toWei: typeof toWei;
    fromWei: typeof fromWei;
    numberToString: typeof numberToString;
    getValueOfUnit: typeof getValueOfUnit;
  };
  export default ethjsUnit;
}

declare module 'number-to-bn' {
  const numberToBN: (
    value: string | number | { toString(base?: number): string },
  ) => import('bnjs4').default;
  export default numberToBN;
}
