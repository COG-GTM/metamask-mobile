declare module '@metamask/react-native-button/coalesceNonElementChildren' {
  import { ReactNode } from 'react';

  export default function coalesceNonElementChildren(
    children: ReactNode,
    coalesceNodes: (children: ReactNode[], index: number) => ReactNode,
  ): ReactNode[];
}
