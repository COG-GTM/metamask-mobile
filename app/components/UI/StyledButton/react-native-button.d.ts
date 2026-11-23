declare module '@metamask/react-native-button' {
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Button: import('react').ComponentType<any>;
  export default Button;
}

declare module '@metamask/react-native-button/coalesceNonElementChildren' {
  export default function coalesceNonElementChildren(
    children: import('react').ReactNode,
    render: (
      children: import('react').ReactNode,
      index: number,
    ) => import('react').ReactNode,
  ): import('react').ReactNode[];
}
