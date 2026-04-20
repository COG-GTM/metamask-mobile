import { EventType } from '@metamask/sdk-communication-layer';
import AndroidSDKEventHandler from './AndroidNativeSDKEventHandler';

describe('AndroidSDKEventHandler', () => {
  it('forwards MESSAGE events to the onMessageReceived callback', () => {
    const handler = new AndroidSDKEventHandler();
    const addListenerSpy = jest
      .spyOn(handler, 'addListener')
      .mockImplementation(
        ((..._args: unknown[]) => ({ remove: jest.fn() })) as never,
      );
    const cb = jest.fn();

    handler.onMessageReceived(cb);

    expect(addListenerSpy).toHaveBeenCalledWith(
      EventType.MESSAGE,
      expect.any(Function),
    );
    // Invoke the inner function to confirm it passes the message along
    const innerFn = addListenerSpy.mock.calls[0][1] as (msg: string) => void;
    innerFn('hello');
    expect(cb).toHaveBeenCalledWith('hello');
  });

  it('forwards CLIENTS_CONNECTED events to the onClientsConnected callback', () => {
    const handler = new AndroidSDKEventHandler();
    const addListenerSpy = jest
      .spyOn(handler, 'addListener')
      .mockImplementation(
        ((..._args: unknown[]) => ({ remove: jest.fn() })) as never,
      );
    const cb = jest.fn();

    handler.onClientsConnected(cb);

    expect(addListenerSpy).toHaveBeenCalledWith(
      EventType.CLIENTS_CONNECTED,
      expect.any(Function),
    );
    const innerFn = addListenerSpy.mock.calls[0][1] as (info: string) => void;
    innerFn('client-info');
    expect(cb).toHaveBeenCalledWith('client-info');
  });

  it('forwards CLIENTS_DISCONNECTED events to the onClientsDisconnected callback', () => {
    const handler = new AndroidSDKEventHandler();
    const addListenerSpy = jest
      .spyOn(handler, 'addListener')
      .mockImplementation(
        ((..._args: unknown[]) => ({ remove: jest.fn() })) as never,
      );
    const cb = jest.fn();

    handler.onClientsDisconnected(cb);

    expect(addListenerSpy).toHaveBeenCalledWith(
      EventType.CLIENTS_DISCONNECTED,
      expect.any(Function),
    );
    const innerFn = addListenerSpy.mock.calls[0][1] as (id: string) => void;
    innerFn('id-123');
    expect(cb).toHaveBeenCalledWith('id-123');
  });
});
