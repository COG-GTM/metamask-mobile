/**
 * Declarations for bindings that the legacy migrations (002, 003, 004, 015)
 * import but that are not declared by the modules they are imported from.
 * These are additive, type-only augmentations matched by literal import
 * specifier, so they also apply to any other importer using the same
 * specifier; runtime behavior is unchanged.
 */
declare module '@metamask/controller-utils' {
  export const NetworksChainId: Record<string, string>;
}

declare module '../../util/networks' {
  export const isSafeChainId: (chainId: number) => boolean;
}

export {};
