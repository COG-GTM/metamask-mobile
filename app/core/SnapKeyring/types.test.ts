import type {
  SnapKeyringBuilderAllowActions,
  SnapKeyringBuilderMessenger,
} from './types';

describe('SnapKeyring types', () => {
  it('SnapKeyringBuilderAllowActions type includes approval actions', () => {
    const actions: SnapKeyringBuilderAllowActions['type'][] = [
      'ApprovalController:addRequest',
      'ApprovalController:acceptRequest',
      'ApprovalController:rejectRequest',
    ];
    actions.forEach((action) => {
      expect(typeof action).toBe('string');
    });
  });

  it('SnapKeyringBuilderAllowActions type includes keyring actions', () => {
    const action: SnapKeyringBuilderAllowActions['type'] = 'KeyringController:getAccounts';
    expect(typeof action).toBe('string');
  });

  it('SnapKeyringBuilderAllowActions type includes accounts controller actions', () => {
    const actions: SnapKeyringBuilderAllowActions['type'][] = [
      'AccountsController:setSelectedAccount',
      'AccountsController:getAccountByAddress',
      'AccountsController:listMultichainAccounts',
      'AccountsController:setAccountName',
    ];
    actions.forEach((action) => {
      expect(typeof action).toBe('string');
    });
  });

  it('SnapKeyringBuilderMessenger type exists', () => {
    const typeExists: boolean = true as SnapKeyringBuilderMessenger extends object ? true : false;
    expect(typeExists).toBe(true);
  });
});
