/**
 * Minimal ambient declaration for the untyped `@metamask/ethjs-query` package,
 * covering the constructor usage in the legacy confirmation flows.
 */
declare module '@metamask/ethjs-query' {
  export default class Eth {
    constructor(provider: unknown);
  }
}
