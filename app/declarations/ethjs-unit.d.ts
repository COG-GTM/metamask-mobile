declare module '@metamask/ethjs-unit' {
  import type BN from 'bnjs4';

  export type EthjsNumberLike = string | number | BN | { toString(): string };

  export interface FromWeiOptions {
    pad?: boolean;
    commify?: boolean;
  }

  export const unitMap: Record<string, string>;
  export function numberToString(arg: EthjsNumberLike): string;
  export function getValueOfUnit(unitInput?: string): BN;
  export function fromWei(
    weiInput: EthjsNumberLike,
    unit?: string,
    optionsInput?: FromWeiOptions,
  ): string;
  export function toWei(etherInput: EthjsNumberLike, unit?: string): BN;

  const ethjsUnit: {
    unitMap: typeof unitMap;
    numberToString: typeof numberToString;
    getValueOfUnit: typeof getValueOfUnit;
    fromWei: typeof fromWei;
    toWei: typeof toWei;
  };
  export default ethjsUnit;
}

declare module 'number-to-bn' {
  import type { EthjsNumberLike } from '@metamask/ethjs-unit';

  function numberToBN(arg: EthjsNumberLike): import('bnjs4');
  export default numberToBN;
}
