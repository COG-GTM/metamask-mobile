jest.mock('../../RPCMethods/RPCMethodMiddleware', () => ({
  SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES: {
    showNameSnapAccount: 'snap_manageAccounts:showNameSnapAccount',
  },
}));

import { showAccountNameSuggestionDialog } from './showDialog';

describe('showAccountNameSuggestionDialog', () => {
  it('should call ApprovalController:addRequest with correct params', async () => {
    const mockMessenger = {
      call: jest.fn().mockResolvedValue({ success: true, name: 'My Account' }),
    } as any;

    const result = await showAccountNameSuggestionDialog(
      'npm:test-snap',
      mockMessenger,
      'Suggested Name',
    );

    expect(mockMessenger.call).toHaveBeenCalledWith(
      'ApprovalController:addRequest',
      expect.objectContaining({
        origin: 'npm:test-snap',
        type: 'snap_manageAccounts:showNameSnapAccount',
        requestData: {
          snapSuggestedAccountName: 'Suggested Name',
        },
      }),
      true,
    );
    expect(result).toEqual({ success: true, name: 'My Account' });
  });

  it('should return success false when no confirmation result', async () => {
    const mockMessenger = {
      call: jest.fn().mockResolvedValue(null),
    } as any;

    const result = await showAccountNameSuggestionDialog(
      'npm:test-snap',
      mockMessenger,
      'Suggested Name',
    );

    expect(result).toEqual({ success: false });
  });

  it('should throw on error', async () => {
    const mockMessenger = {
      call: jest.fn().mockRejectedValue(new Error('approval failed')),
    } as any;

    await expect(
      showAccountNameSuggestionDialog('npm:test-snap', mockMessenger, 'Name'),
    ).rejects.toThrow('Error occurred while showing name account dialog');
  });
});
