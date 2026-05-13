/**
 * Transaction types for the MetaMask Mobile app.
 *
 * These types complement the types from @metamask/transaction-controller
 * with app-specific transaction representations used in UI components
 * and Redux state.
 */

/**
 * App-level transaction element representation used in transaction lists.
 * Will be refined as TransactionElement and related components are migrated.
 */
export interface AppTransaction {
  id: string;
  status: string;
  time: number;
  chainId: string;
  txParams: {
    from: string;
    to?: string;
    value?: string;
    data?: string;
    gas?: string;
    gasPrice?: string;
  };
}
