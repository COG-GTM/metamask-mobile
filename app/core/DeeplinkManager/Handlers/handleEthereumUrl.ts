import { CHAIN_IDS } from '@metamask/transaction-controller';
import { ParseOutput, parse } from 'eth-url-parser';
import { toHex } from '@metamask/controller-utils';
import { Alert } from 'react-native';
import { strings } from '../../../../locales/i18n';
import { ETH_ACTIONS } from '../../../constants/deeplinks';
import formattedDeeplinkParsedValue from '../../../util/formattedDeeplinkParsedValue';
import { NetworkSwitchErrorType } from '../../../constants/error';
import { getDecimalChainId } from '../../../util/networks';
import { MAINNET } from '../../../constants/network';
import Engine from '../../Engine';
import DeeplinkManager from '../DeeplinkManager';
import {
  addTransactionForDeeplink,
  isDeeplinkRedesignedConfirmationCompatible,
} from '../../../components/Views/confirmations/utils/deeplink';
import { store } from '../../../store';
import { selectEvmNetworkConfigurationsByChainId } from '../../../selectors/networkController';
import { selectSelectedNonEvmNetworkName } from '../../../selectors/multichainNetworkController';
import { requestDeeplinkNetworkSwitchApproval } from './switchNetwork';
import { handleNetworkSwitch } from '../../../util/networks/handleNetworkSwitch';

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

    // If the deeplink has a goerli chainId, show deprecation modal and return
    if (
      ethUrl.chain_id === getDecimalChainId(CHAIN_IDS.GOERLI) ||
      ethUrl.chain_id === CHAIN_IDS.GOERLI
    ) {
      deeplinkManager.navigation.navigate('DeprecatedNetworkDetails', {});
      return;
    }

    const isRedesignedConfirmation = isDeeplinkRedesignedConfirmationCompatible(
      ethUrl.function_name,
    );
    let isOnRequestedNetwork = false;

    if (!MultichainNetworkController.state.isEvmSelected) {
      /**
       * Ask once for the final EVM network so a declined prompt never leaves
       * the wallet on an intermediate network.
       */
      const state = store.getState();
      const targetChainId =
        !isRedesignedConfirmation && ethUrl.chain_id
          ? toHex(ethUrl.chain_id)
          : CHAIN_IDS.MAINNET;
      const targetNetwork =
        selectEvmNetworkConfigurationsByChainId(state)?.[targetChainId];
      if (targetChainId !== CHAIN_IDS.MAINNET && !targetNetwork) {
        throw new Error(
          `Unable to find network with chain id ${ethUrl.chain_id}`,
        );
      }
      const approved = await requestDeeplinkNetworkSwitchApproval({
        currentNetworkName: selectSelectedNonEvmNetworkName(state) ?? '',
        networkName: targetNetwork?.name ?? 'Ethereum Mainnet',
      });
      if (!approved) {
        return;
      }
      if (targetChainId === CHAIN_IDS.MAINNET) {
        await MultichainNetworkController.setActiveNetwork(MAINNET);
      } else {
        handleNetworkSwitch(targetChainId);
      }
      isOnRequestedNetwork = true;
    }

    if (isRedesignedConfirmation) {
      await addTransactionForDeeplink(txMeta);
      return;
    }

    /**
     * The legacy send/approve flows act on the globally selected network, so
     * the requested network is only activated after the user approves it.
     */
    if (!isOnRequestedNetwork) {
      isOnRequestedNetwork = await deeplinkManager._handleNetworkSwitch(
        ethUrl.chain_id,
      );
    }
    if (!isOnRequestedNetwork) {
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
