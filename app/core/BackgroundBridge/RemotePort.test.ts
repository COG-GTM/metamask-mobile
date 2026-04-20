import RemotePort from './RemotePort';

describe('RemotePort', () => {
  it('invokes the provided sendMessage on postMessage', () => {
    const sendMessage = jest.fn();
    const port = new RemotePort(sendMessage);
    const payload = { foo: 'bar' };

    port.postMessage(payload);

    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(sendMessage).toHaveBeenCalledWith(payload);
  });

  it('retains EventEmitter behavior', () => {
    const port = new RemotePort(jest.fn());
    const listener = jest.fn();
    port.on('msg', listener);
    port.emit('msg', 1, 2);
    expect(listener).toHaveBeenCalledWith(1, 2);
  });
});
