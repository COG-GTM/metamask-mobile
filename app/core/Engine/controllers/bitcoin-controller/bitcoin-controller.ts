import {
  BaseController,
  type RestrictedMessenger,
} from '@metamask/base-controller';
import type { AccountsControllerListMultichainAccountsAction } from '@metamask/accounts-controller';
import type {
  KeyringControllerGetStateAction,
  KeyringControllerStateChangeEvent,
} from '@metamask/keyring-controller';
import { BtcAccountType, BtcScope } from '@metamask/keyring-api';
import type { InternalAccount } from '@metamask/keyring-internal-api';
import {
  BitcoinNetworkClient,
  type BitcoinAddressBalance,
  type BitcoinFeeEstimates,
  type BitcoinUtxo,
} from './bitcoin-network-client';
import Logger from '../../../../util/Logger';

// ---- State ----

export type BitcoinAccountState = {
  balance: string;
  utxos: BitcoinUtxo[];
  lastUpdated: number;
};

export type BitcoinControllerState = {
  accounts: Record<string, BitcoinAccountState>;
  feeEstimates: BitcoinFeeEstimates | null;
  feeEstimatesLastUpdated: number;
  isLoading: boolean;
};

const defaultState: BitcoinControllerState = {
  accounts: {},
  feeEstimates: null,
  feeEstimatesLastUpdated: 0,
  isLoading: false,
};

// ---- Controller name ----

const CONTROLLER_NAME = 'BitcoinController';

// ---- Metadata ----

const controllerMetadata = {
  accounts: { persist: true, anonymous: false },
  feeEstimates: { persist: false, anonymous: false },
  feeEstimatesLastUpdated: { persist: false, anonymous: false },
  isLoading: { persist: false, anonymous: false },
} as const;

// ---- Actions ----

export type BitcoinControllerGetStateAction = {
  type: `${typeof CONTROLLER_NAME}:getState`;
  handler: () => BitcoinControllerState;
};

export type BitcoinControllerUpdateBalancesAction = {
  type: `${typeof CONTROLLER_NAME}:updateBalances`;
  handler: () => Promise<void>;
};

export type BitcoinControllerActions =
  | BitcoinControllerGetStateAction
  | BitcoinControllerUpdateBalancesAction;

// ---- Events ----

export type BitcoinControllerStateChangeEvent = {
  type: `${typeof CONTROLLER_NAME}:stateChange`;
  payload: [BitcoinControllerState, []];
};

export type BitcoinControllerEvents = BitcoinControllerStateChangeEvent;

// ---- Allowed actions/events from other controllers ----

type AllowedActions =
  | AccountsControllerListMultichainAccountsAction
  | KeyringControllerGetStateAction;

type AllowedEvents = KeyringControllerStateChangeEvent;

// ---- Messenger ----

export type BitcoinControllerMessenger = RestrictedMessenger<
  typeof CONTROLLER_NAME,
  BitcoinControllerActions | AllowedActions,
  BitcoinControllerEvents | AllowedEvents,
  AllowedActions['type'],
  AllowedEvents['type']
>;

// ---- Constants ----

const BALANCE_UPDATE_INTERVAL = 30_000; // 30 seconds
const FEE_UPDATE_INTERVAL = 60_000; // 60 seconds

// ---- Controller ----

export class BitcoinController extends BaseController<
  typeof CONTROLLER_NAME,
  BitcoinControllerState,
  BitcoinControllerMessenger
> {
  private readonly networkClient: BitcoinNetworkClient;
  private balancePollHandle: ReturnType<typeof setInterval> | null = null;
  private feePollHandle: ReturnType<typeof setInterval> | null = null;

  constructor({
    messenger,
    state,
    networkClient,
  }: {
    messenger: BitcoinControllerMessenger;
    state?: Partial<BitcoinControllerState>;
    networkClient?: BitcoinNetworkClient;
  }) {
    super({
      name: CONTROLLER_NAME,
      metadata: controllerMetadata,
      messenger,
      state: { ...defaultState, ...state },
    });

    this.networkClient = networkClient ?? BitcoinNetworkClient.mainnet();

    this.messagingSystem.registerActionHandler(
      `${CONTROLLER_NAME}:updateBalances`,
      async () => this.updateBalances(),
    );
  }

  /**
   * Start polling for balance and fee updates.
   */
  startPolling(): void {
    this.stopPolling();

    this.balancePollHandle = setInterval(
      () => this.updateBalances().catch(Logger.error),
      BALANCE_UPDATE_INTERVAL,
    );

    this.feePollHandle = setInterval(
      () => this.updateFeeEstimates().catch(Logger.error),
      FEE_UPDATE_INTERVAL,
    );

    // Initial fetch
    this.updateBalances().catch(Logger.error);
    this.updateFeeEstimates().catch(Logger.error);
  }

  /**
   * Stop all polling intervals.
   */
  stopPolling(): void {
    if (this.balancePollHandle) {
      clearInterval(this.balancePollHandle);
      this.balancePollHandle = null;
    }
    if (this.feePollHandle) {
      clearInterval(this.feePollHandle);
      this.feePollHandle = null;
    }
  }

  /**
   * Get Bitcoin accounts from the AccountsController.
   */
  private getBitcoinAccounts(): InternalAccount[] {
    const allAccounts = this.messagingSystem.call(
      'AccountsController:listMultichainAccounts',
    );
    return allAccounts.filter(
      (account) => account.type === BtcAccountType.P2wpkh,
    );
  }

  /**
   * Update balances and UTXOs for all known Bitcoin accounts.
   */
  async updateBalances(): Promise<void> {
    const btcAccounts = this.getBitcoinAccounts();
    if (btcAccounts.length === 0) {
      return;
    }

    this.update((draft) => {
      draft.isLoading = true;
    });

    try {
      const results = await Promise.allSettled(
        btcAccounts.map(async (account) => {
          const address = account.address;
          const [balanceInfo, utxos] = await Promise.all([
            this.networkClient.getBalance(address),
            this.networkClient.getUtxos(address),
          ]);
          return { address, balanceInfo, utxos };
        }),
      );

      this.update((draft) => {
        // Prune accounts that no longer exist
        const currentAddresses = new Set(btcAccounts.map((a) => a.address));
        for (const address of Object.keys(draft.accounts)) {
          if (!currentAddresses.has(address)) {
            delete draft.accounts[address];
          }
        }

        for (const result of results) {
          if (result.status === 'fulfilled') {
            const { address, balanceInfo, utxos } = result.value;
            draft.accounts[address] = {
              balance: balanceInfo.balance.toString(),
              utxos,
              lastUpdated: Date.now(),
            };
          }
        }
        draft.isLoading = false;
      });
    } catch (error) {
      Logger.error(
        error as Error,
        'BitcoinController: Failed to update balances',
      );
      this.update((draft) => {
        draft.isLoading = false;
      });
    }
  }

  /**
   * Update recommended fee estimates from the network.
   */
  async updateFeeEstimates(): Promise<void> {
    if (this.getBitcoinAccounts().length === 0) {
      return;
    }

    try {
      const feeEstimates = await this.networkClient.getFeeEstimates();
      this.update((draft) => {
        draft.feeEstimates = feeEstimates;
        draft.feeEstimatesLastUpdated = Date.now();
      });
    } catch (error) {
      Logger.error(
        error as Error,
        'BitcoinController: Failed to update fee estimates',
      );
    }
  }

  /**
   * Broadcast a signed Bitcoin transaction to the network.
   *
   * @param rawTxHex - The signed transaction hex.
   * @returns The transaction ID.
   */
  async broadcastTransaction(rawTxHex: string): Promise<string> {
    const txId = await this.networkClient.broadcastTransaction(rawTxHex);

    // Refresh balances after broadcasting
    await this.updateBalances();

    return txId;
  }

  /**
   * Get the balance for a specific Bitcoin address from cached state.
   *
   * @param address - The Bitcoin address.
   * @returns The balance in satoshis as a string, or '0' if unknown.
   */
  getBalance(address: string): string {
    return this.state.accounts[address]?.balance ?? '0';
  }

  /**
   * Get UTXOs for a specific Bitcoin address from cached state.
   *
   * @param address - The Bitcoin address.
   * @returns Array of UTXOs, or empty array if unknown.
   */
  getUtxos(address: string): BitcoinUtxo[] {
    return this.state.accounts[address]?.utxos ?? [];
  }

  destroy(): void {
    this.stopPolling();
    super.destroy();
  }
}
