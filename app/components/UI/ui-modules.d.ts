// Ambient declarations for untyped JavaScript dependencies used by the
// components under `app/components/UI`. Declared here (rather than in
// `app/declarations/index.d.ts`) to keep the TypeScript migration of this
// directory self-contained.

declare module 'react-native-confetti';

declare module '@metamask/react-native-button';

declare module '@metamask/react-native-button/coalesceNonElementChildren' {
  const coalesceNonElementChildren: (
    children: React.ReactNode,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mapper: (children: React.ReactNode, index: number) => any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ) => any[];
  export default coalesceNonElementChildren;
}
