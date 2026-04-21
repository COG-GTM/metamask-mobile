import { NftControllerMessenger } from '@metamask/assets-controllers';
import { BaseControllerMessenger } from '../../types';

/**
 * Get the NftControllerMessenger for the NftController.
 *
 * @param baseControllerMessenger - The base controller messenger.
 * @returns The NftControllerMessenger.
 */
export function getNftControllerMessenger(
  baseControllerMessenger: BaseControllerMessenger,
): NftControllerMessenger {
  return baseControllerMessenger.getRestricted({
    name: 'NftController',
    allowedActions: [
      'AccountsController:getAccount',
      'AccountsController:getSelectedAccount',
      'ApprovalController:addRequest',
      'AssetsContractController:getERC721AssetName',
      'AssetsContractController:getERC721AssetSymbol',
      'AssetsContractController:getERC721TokenURI',
      'AssetsContractController:getERC721OwnerOf',
      'AssetsContractController:getERC1155BalanceOf',
      'AssetsContractController:getERC1155TokenURI',
      'NetworkController:getNetworkClientById',
    ],
    allowedEvents: [
      'PreferencesController:stateChange',
      'NetworkController:networkDidChange',
      'AccountsController:selectedEvmAccountChange',
    ],
  });
}
