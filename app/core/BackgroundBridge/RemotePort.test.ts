import RemotePort from './RemotePort';

describe('RemotePort', () => {
  it('should create a RemotePort instance', () => {
    const sendMessage = jest.fn();
    const port = new RemotePort(sendMessage);
    expect(port).toBeDefined();
  });

  it('should call sendMessage when postMessage is called', () => {
    const sendMessage = jest.fn();
    const port = new RemotePort(sendMessage);
    const msg = { id: 1, result: 'ok' };
    port.postMessage(msg);
    expect(sendMessage).toHaveBeenCalledWith(msg);
  });

  it('should inherit from EventEmitter', () => {
    const port = new RemotePort(jest.fn());
    expect(typeof port.on).toBe('function');
    expect(typeof port.emit).toBe('function');
  });
});
