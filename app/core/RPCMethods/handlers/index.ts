import { PermittedHandlerExport } from '@metamask/permission-controller';
import { Json, JsonRpcParams } from '@metamask/utils';
import requestEthereumAccounts from '../eth-request-accounts';
import ethAccounts from '../eth_accounts';

export const eip1193OnlyHandlers: PermittedHandlerExport<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  any,
  JsonRpcParams,
  Json
>[] = [ethAccounts, requestEthereumAccounts];
