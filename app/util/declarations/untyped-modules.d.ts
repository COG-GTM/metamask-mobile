// Minimal type declarations for untyped packages used by the utilities in
// `app/util`. They cover only the surface these utilities rely on.

declare module '@metamask/ethjs-unit' {
  import BN from 'bnjs4';

  type EthjsUnitValue = string | number | BN;

  export function fromWei(
    value: EthjsUnitValue,
    unit: string,
    options?: { pad?: boolean; commify?: boolean },
  ): string;
  export function toWei(value: EthjsUnitValue, unit: string): BN;
  export function numberToString(value: EthjsUnitValue): string;
  export function unitMap(): Record<string, string>;

  const ethjsUnit: {
    fromWei: typeof fromWei;
    toWei: typeof toWei;
    numberToString: typeof numberToString;
  };

  export default ethjsUnit;
}

declare module 'number-to-bn' {
  export default function numberToBN(
    value: string | number | import('bnjs4').default,
  ): import('bnjs4').default;
}

declare module 'unicode-confusables' {
  export function confusables(
    input: string,
  ): { point: string; similarTo?: string }[];
  export function isConfusing(input: string): boolean;
}

declare module 'ethereumjs-abi' {
  export function rawEncode(types: string[], values: unknown[]): Buffer;
  export function rawDecode(types: string[], data: Buffer): unknown[];
  export function methodID(name: string, types: string[]): Buffer;
  export function soliditySHA3(types: string[], values: unknown[]): Buffer;
}

declare module 'humanize-duration' {
  interface HumanizeDurationOptions {
    language?: string;
    fallbacks?: string[];
    largest?: number;
    units?: string[];
    round?: boolean;
    delimiter?: string;
    spacer?: string;
    conjunction?: string;
    serialComma?: boolean;
    unitMeasures?: Record<string, number>;
  }

  export default function humanizeDuration(
    milliseconds: number,
    options?: HumanizeDurationOptions,
  ): string;
}

declare module 'enzyme-adapter-react-16' {
  import { EnzymeAdapter } from 'enzyme';

  const Adapter: new () => EnzymeAdapter;
  export default Adapter;
}

declare module '@react-native-clipboard/clipboard/jest/clipboard-mock.js' {
  const clipboardMock: Record<string, unknown>;
  export default clipboardMock;
}
