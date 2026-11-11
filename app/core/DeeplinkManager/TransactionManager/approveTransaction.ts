import { generateApprovalData } from '../../../util/transactions';
import { ParseOutput } from 'eth-url-parser';
import { strings } from '../../../../locales/i18n';
import { getAddress } from '../../../util/address';
import { addTransaction } from '../../../util/transaction-controller';
import { getGlobalNetworkClientId } from '../../../util/networks/global-network';
import { NetworkSwitchErrorType } from '../../../constants/error';
import DeeplinkManager from '../DeeplinkManager';
import Engine from '../../Engine';
import NotificationManager from '../../NotificationManager';
import { WalletDevice } from '@metamask/transaction-controller';
import { toChecksumHexAddress, toHex } from '@metamask/controller-utils';
import { NetworkClientId } from '@metamask/network-controller';

/**
 * Resolves the network client for the deeplink's chain without changing the
 * wallet's globally selected network.
 */
function getNetworkClientIdForDeeplink(chainId?: string): NetworkClientId {
  if (!chainId) {
    return getGlobalNetworkClientId();
  }

  let networkClientId: NetworkClientId | undefined;
  try {
    networkClientId =
      Engine.context.NetworkController.findNetworkClientIdByChainId(
        toHex(chainId),
      );
  } catch {
    networkClientId = undefined;
  }

  if (!networkClientId) {
    throw new Error(`${NetworkSwitchErrorType.unknownNetworkId} ${chainId}`);
  }

  return networkClientId;
}

async function approveTransaction({
  deeplinkManager,
  ethUrl,
  origin,
}: {
  deeplinkManager: DeeplinkManager;
  ethUrl: ParseOutput;
  origin: string;
}) {
  const { parameters, target_address, chain_id } = ethUrl;
  const { AccountsController } = Engine.context;

  const networkClientId = getNetworkClientIdForDeeplink(chain_id);

  const uint256Number = Number(parameters?.uint256);

  if (Number.isNaN(uint256Number))
    throw new Error('The parameter uint256 should be a number');
  if (!Number.isInteger(uint256Number))
    throw new Error('The parameter uint256 should be an integer');

  const value = uint256Number.toString(16);

  const spenderAddress = await getAddress(
    parameters?.address || '',
    chain_id as string,
  );

  if (!spenderAddress) {
    NotificationManager.showSimpleNotification({
      status: 'simple_notification_rejected',
      duration: 5000,
      title: strings('transaction.invalid_recipient'),
      description: strings('transaction.invalid_recipient_description'),
    });
    deeplinkManager.navigation.navigate('WalletView');
    return;
  }

  const selectedAccount = AccountsController.getSelectedAccount();

  const txParams = {
    to: target_address.toString(),
    from: toChecksumHexAddress(selectedAccount.address),
    value: '0x0',
    data: generateApprovalData({ spender: spenderAddress, value }),
  };

  addTransaction(txParams, {
    deviceConfirmedOn: WalletDevice.MM_MOBILE,
    networkClientId,
    origin,
  });
}

export default approveTransaction;
