import { showAccountNameSuggestionDialog } from './showDialog';
import { SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES } from '../../RPCMethods/RPCMethodMiddleware';
import type { SnapKeyringBuilderMessenger } from '../types';

describe('showAccountNameSuggestionDialog', () => {
  const snapId = 'npm:@metamask/example-snap';
  const suggestion = 'Suggested Name';

  it('calls ApprovalController:addRequest with the expected args', async () => {
    const call = jest.fn().mockResolvedValue({ success: true, name: 'Chosen' });
    const messenger = { call } as unknown as SnapKeyringBuilderMessenger;

    const result = await showAccountNameSuggestionDialog(
      snapId,
      messenger,
      suggestion,
    );

    expect(call).toHaveBeenCalledWith(
      'ApprovalController:addRequest',
      {
        origin: snapId,
        type: SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES.showNameSnapAccount,
        requestData: {
          snapSuggestedAccountName: suggestion,
        },
      },
      true,
    );
    expect(result).toEqual({ success: true, name: 'Chosen' });
  });

  it('returns { success: false } when the controller returns a falsy value', async () => {
    const call = jest.fn().mockResolvedValue(null);
    const messenger = { call } as unknown as SnapKeyringBuilderMessenger;

    const result = await showAccountNameSuggestionDialog(
      snapId,
      messenger,
      suggestion,
    );

    expect(result).toEqual({ success: false });
  });

  it('wraps rejected calls in a descriptive error', async () => {
    const call = jest.fn().mockRejectedValue(new Error('nope'));
    const messenger = { call } as unknown as SnapKeyringBuilderMessenger;

    await expect(
      showAccountNameSuggestionDialog(snapId, messenger, suggestion),
    ).rejects.toThrow(/Error occurred while showing name account dialog/);
  });
});
