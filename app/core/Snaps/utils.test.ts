import { handleSnapRequest } from './utils';
import { SnapControllerHandleRequestAction } from '../Engine/controllers/snaps';

describe('handleSnapRequest', () => {
  it('calls the controller messenger with the SnapController handle request action and args', async () => {
    const call = jest.fn().mockResolvedValue({ ok: true });
    const controllerMessenger = { call } as unknown as Parameters<
      typeof handleSnapRequest
    >[0];

    const args = {
      snapId: 'npm:@metamask/example-snap',
      origin: 'metamask',
      handler: 'onRpcRequest',
      request: { method: 'foo', params: [] },
    } as unknown as Parameters<typeof handleSnapRequest>[1];

    await expect(handleSnapRequest(controllerMessenger, args)).resolves.toEqual(
      { ok: true },
    );
    expect(call).toHaveBeenCalledWith(SnapControllerHandleRequestAction, args);
  });

  it('propagates errors thrown by the controller messenger', async () => {
    const call = jest.fn().mockRejectedValue(new Error('boom'));
    const controllerMessenger = { call } as unknown as Parameters<
      typeof handleSnapRequest
    >[0];

    const args = {
      snapId: 'npm:@metamask/example-snap',
      origin: 'metamask',
      handler: 'onRpcRequest',
      request: {},
    } as unknown as Parameters<typeof handleSnapRequest>[1];

    await expect(handleSnapRequest(controllerMessenger, args)).rejects.toThrow(
      'boom',
    );
  });
});
