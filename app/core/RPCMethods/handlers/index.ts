import requestEthereumAccounts, {
  type RequestEthereumAccountsHooks,
} from '../eth-request-accounts';
import ethAccounts from '../eth_accounts';
import type { PermittedHandlerExport } from '@metamask/permission-controller';
import type { Json, JsonRpcParams } from '@metamask/utils';
import type { EthAccountHooks } from '../eth_accounts/types';

export type Eip1193OnlyHooks = EthAccountHooks & RequestEthereumAccountsHooks;

export const eip1193OnlyHandlers: (
  | PermittedHandlerExport<EthAccountHooks, JsonRpcParams, Json>
  | PermittedHandlerExport<RequestEthereumAccountsHooks, JsonRpcParams, Json>
)[] = [ethAccounts, requestEthereumAccounts];
