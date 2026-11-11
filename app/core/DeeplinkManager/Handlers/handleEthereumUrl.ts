import { CHAIN_IDS } from '@metamask/transaction-controller';
import { ParseOutput, parse } from 'eth-url-parser';
import { Alert } from 'react-native';
import { strings } from '../../../../locales/i18n';
import { ETH_ACTIONS } from '../../../constants/deeplinks';
import formattedDeeplinkParsedValue from '../../../util/formattedDeeplinkParsedValue';
import { NetworkSwitchErrorType } from '../../../constants/error';
import { getDecimalChainId } from '../../../util/networks';
import Engine from '../../Engine';
import DeeplinkManager from '../DeeplinkManager';
import {
  addTransactionForDeeplink,
  isDeeplinkRedesignedConfirmationCompatible,
} from '../../../components/Views/confirmations/utils/deeplink';

const MAINNET_DECIMAL_CHAIN_ID = '1';

async function handleEthereumUrl({
  deeplinkManager,
  url,
  origin,
}: {
  deeplinkManager: DeeplinkManager;
  url: string;
  origin: string;
}) {
  let ethUrl: ParseOutput;
  try {
    ethUrl = parse(url);
  } catch (e) {
    if (e) Alert.alert(strings('deeplink.invalid'), e.toString());
    return;
  }

  const txMeta = { ...ethUrl, source: url };

  try {
    const { MultichainNetworkController } = Engine.context;
    const { isEvmSelected } = MultichainNetworkController.state;

    // If the deeplink has a goerli chainId, show deprecation modal and return
    if (
      ethUrl.chain_id === getDecimalChainId(CHAIN_IDS.GOERLI) ||
      ethUrl.chain_id === CHAIN_IDS.GOERLI
    ) {
      deeplinkManager.navigation.navigate('DeprecatedNetworkDetails', {});
      return;
    }

    // The redesigned confirmation uses the chain from the link, so the active
    // network only changes (with confirmation) when a non-EVM network is selected
    if (isDeeplinkRedesignedConfirmationCompatible(ethUrl.function_name)) {
      if (
        !isEvmSelected &&
        !(await deeplinkManager._handleNetworkSwitch(MAINNET_DECIMAL_CHAIN_ID))
      ) {
        return;
      }
      await addTransactionForDeeplink(txMeta);
      return;
    }

    /**
     * Validate and switch network (after user confirmation) before performing
     * any other action
     */
    const switchToChainId =
      ethUrl.chain_id ?? (isEvmSelected ? undefined : MAINNET_DECIMAL_CHAIN_ID);
    if (!(await deeplinkManager._handleNetworkSwitch(switchToChainId))) {
      return;
    }

    switch (ethUrl.function_name) {
      case ETH_ACTIONS.TRANSFER: {
        deeplinkManager.navigation.navigate('SendView', {
          screen: 'Send',
          params: { txMeta: { ...txMeta, action: 'send-token' } },
        });
        break;
      }
      case ETH_ACTIONS.APPROVE: {
        await deeplinkManager._approveTransaction(ethUrl, origin);
        break;
      }
      default: {
        if (ethUrl.parameters?.value) {
          ethUrl.parameters.value = formattedDeeplinkParsedValue(
            ethUrl.parameters.value,
          );
          deeplinkManager.navigation.navigate('SendView', {
            screen: 'Send',
            params: { txMeta: { ...txMeta, action: 'send-eth' } },
          });
        } else {
          deeplinkManager.navigation.navigate('SendFlowView', {
            screen: 'SendTo',
            params: { txMeta },
          });
        }
      }
    }
    // TODO: Replace "any" with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    let alertMessage;
    switch (e.message) {
      case NetworkSwitchErrorType.missingNetworkId:
        alertMessage = strings('send.network_missing_id');
        break;
      default:
        alertMessage = strings('send.network_not_found_description', {
          chain_id: getDecimalChainId(ethUrl.chain_id),
        });
    }
    Alert.alert(strings('send.network_not_found_title'), alertMessage);
  }
}

export default handleEthereumUrl;
