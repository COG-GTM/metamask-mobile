/**
 * Declarations for bindings that the legacy migrations (002, 003, 004, 015)
 * import but that are not declared by the modules they are imported from.
 * They exist solely to type those historical imports; runtime behavior of the
 * migrations is unchanged.
 */
declare module '@metamask/controller-utils' {
  export const NetworksChainId: Record<string, string>;
}

declare module '../../util/networks' {
  export const isSafeChainId: (chainId: number) => boolean;
}

export {};
