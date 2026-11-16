import { BaseControllerMessenger } from '../../types';
import { ExtendedControllerMessenger } from '../../../ExtendedControllerMessenger';
import { getSignatureControllerMessenger } from './signature-controller-messenger';

describe('getSignatureControllerMessenger', () => {
  const arrangeMocks = () => {
    const baseMessenger: BaseControllerMessenger =
      new ExtendedControllerMessenger();
    const mockGetRestricted = jest.spyOn(baseMessenger, 'getRestricted');
    return { baseMessenger, mockGetRestricted };
  };

  it('returns a restricted messenger with the correct configuration', () => {
    const { baseMessenger, mockGetRestricted } = arrangeMocks();

    const restrictedMessenger = getSignatureControllerMessenger(baseMessenger);

    expect(mockGetRestricted).toHaveBeenCalledTimes(1);
    expect(mockGetRestricted).toHaveBeenCalledWith({
      name: 'SignatureController',
      allowedActions: [
        'AccountsController:getState',
        'ApprovalController:addRequest',
        'LoggingController:add',
        'NetworkController:getNetworkClientById',
        'KeyringController:signMessage',
        'KeyringController:signPersonalMessage',
        'KeyringController:signTypedMessage',
      ],
      allowedEvents: [],
    });
    expect(restrictedMessenger).toBeDefined();
  });

  it('delegates allowed keyring signing actions to the base messenger handlers', async () => {
    const { baseMessenger } = arrangeMocks();
    const signTypedMessage = jest.fn().mockResolvedValue('0xtyped');
    const signPersonalMessage = jest.fn().mockResolvedValue('0xpersonal');
    const signMessage = jest.fn().mockResolvedValue('0xmessage');
    baseMessenger.registerActionHandler(
      'KeyringController:signTypedMessage',
      signTypedMessage,
    );
    baseMessenger.registerActionHandler(
      'KeyringController:signPersonalMessage',
      signPersonalMessage,
    );
    baseMessenger.registerActionHandler(
      'KeyringController:signMessage',
      signMessage,
    );

    const restrictedMessenger = getSignatureControllerMessenger(baseMessenger);
    const typedParams = { from: '0x1', data: '{}' };
    const personalParams = { from: '0x1', data: '0xdead' };

    await expect(
      restrictedMessenger.call(
        'KeyringController:signTypedMessage',
        typedParams,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        'V4' as any,
      ),
    ).resolves.toBe('0xtyped');
    await expect(
      restrictedMessenger.call(
        'KeyringController:signPersonalMessage',
        personalParams,
      ),
    ).resolves.toBe('0xpersonal');
    await expect(
      restrictedMessenger.call('KeyringController:signMessage', personalParams),
    ).resolves.toBe('0xmessage');

    expect(signTypedMessage).toHaveBeenCalledWith(typedParams, 'V4');
    expect(signPersonalMessage).toHaveBeenCalledWith(personalParams);
    expect(signMessage).toHaveBeenCalledWith(personalParams);
  });

  it('delegates approval and logging actions to the base messenger handlers', async () => {
    const { baseMessenger } = arrangeMocks();
    const addRequest = jest.fn().mockResolvedValue({ value: 'approved' });
    const addLog = jest.fn();
    baseMessenger.registerActionHandler(
      'ApprovalController:addRequest',
      addRequest,
    );
    baseMessenger.registerActionHandler('LoggingController:add', addLog);

    const restrictedMessenger = getSignatureControllerMessenger(baseMessenger);
    const approvalRequest = {
      origin: 'https://dapp.example',
      type: 'personal_sign',
    };
    const log = {
      type: 'EthSign',
      data: { signingMethod: 'personal_sign', stage: 'proposed' },
    };

    await expect(
      restrictedMessenger.call(
        'ApprovalController:addRequest',
        approvalRequest,
        true,
      ),
    ).resolves.toEqual({ value: 'approved' });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    restrictedMessenger.call('LoggingController:add', log as any);

    expect(addRequest).toHaveBeenCalledWith(approvalRequest, true);
    expect(addLog).toHaveBeenCalledWith(log);
  });

  it('rejects actions outside the allow-list', () => {
    const { baseMessenger } = arrangeMocks();
    baseMessenger.registerActionHandler(
      'KeyringController:getState',
      jest.fn(),
    );

    const restrictedMessenger = getSignatureControllerMessenger(baseMessenger);

    expect(() =>
      restrictedMessenger.call(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        'KeyringController:getState' as any,
      ),
    ).toThrow('Action missing from allow list: KeyringController:getState');
  });
});
