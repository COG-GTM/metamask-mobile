import Routes from '../../../constants/navigation/Routes';
import { signModalNavDetail } from './ledger';

jest.mock('../../../core/Ledger/Ledger', () => ({
  getDeviceId: jest.fn().mockResolvedValue('device-id-1'),
}));

describe('signModalNavDetail', () => {
  it('returns a navigation descriptor for the Ledger sign modal with the device id', async () => {
    const onConfirmationComplete = jest.fn();
    const [route, params] = await signModalNavDetail({
      messageParams: { data: '0xabc' },
      onConfirmationComplete,
      version: 'V4',
      type: 'eth_signTypedData',
    });

    expect(route).toBe(Routes.LEDGER_MESSAGE_SIGN_MODAL);
    expect(params).toEqual(
      expect.objectContaining({
        deviceId: 'device-id-1',
        onConfirmationComplete,
        version: 'V4',
        type: 'eth_signTypedData',
      }),
    );
  });
});
