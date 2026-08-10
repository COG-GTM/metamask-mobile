import { SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES } from '../../RPCMethods/RPCMethodMiddleware';
import { SnapKeyringBuilderMessenger } from '../types';
import Logger from '../../../util/Logger';

interface CreateAccountConfirmationResult {
  success: boolean;
  name?: string;
}

/**
 * Show the account name suggestion confirmation dialog for a given Snap.
 *
 * @param snapId - Snap ID to show the account name suggestion dialog for.
 * @param controllerMessenger - The controller messenger instance.
 * @param accountNameSuggestion - Suggested name for the new account.
 * @returns The user's confirmation result.
 */
export async function showAccountNameSuggestionDialog(
  snapId: string,
  controllerMessenger: SnapKeyringBuilderMessenger,
  accountNameSuggestion: string,
): Promise<CreateAccountConfirmationResult> {
  try {
    const confirmationResult = (await controllerMessenger.call(
      'ApprovalController:addRequest',
      {
        origin: snapId,
        type: SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES.showNameSnapAccount,
        requestData: {
          snapSuggestedAccountName: accountNameSuggestion,
        },
      },
      true,
    )) as CreateAccountConfirmationResult;

    if (confirmationResult) {
      return {
        success: confirmationResult.success,
        name: confirmationResult.name,
      };
    }
    return { success: false };
  } catch (e) {
    throw new Error(`Error occurred while showing name account dialog.\n${e}`);
  }
}

/**
 * Show the account removal confirmation dialog for a given Snap.
 *
 * @param snapId - Snap ID to show the account removal dialog for.
 * @param controllerMessenger - The controller messenger instance.
 * @param address - Address of the account to remove.
 * @returns True if the user approved the removal, false otherwise.
 */
export async function showAccountRemovalConfirmationDialog(
  snapId: string,
  controllerMessenger: SnapKeyringBuilderMessenger,
  address: string,
): Promise<boolean> {
  try {
    const confirmationResult = await controllerMessenger.call(
      'ApprovalController:addRequest',
      {
        origin: snapId,
        type: SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES.confirmAccountRemoval,
        requestData: {
          publicAddress: address,
        },
      },
      true,
    );

    return Boolean(confirmationResult);
  } catch (e) {
    // A rejected request (or any other failure) must never remove the account.
    Logger.log(`Snap account removal was not confirmed.\n${e}`);
    return false;
  }
}
