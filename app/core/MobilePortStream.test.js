import PortDuplexStream from './MobilePortStream';

describe('MobilePortStream', () => {
  let mockPort;

  beforeEach(() => {
    mockPort = {
      addListener: jest.fn(),
      postMessage: jest.fn(),
    };
  });

  it('creates a PortDuplexStream instance', () => {
    const stream = new PortDuplexStream(mockPort, 'https://example.com');
    expect(stream).toBeDefined();
    expect(stream._port).toBe(mockPort);
    expect(stream._url).toBe('https://example.com');
  });

  it('adds message and disconnect listeners on construction', () => {
    new PortDuplexStream(mockPort, 'https://example.com');
    expect(mockPort.addListener).toHaveBeenCalledTimes(2);
    expect(mockPort.addListener).toHaveBeenCalledWith(
      'message',
      expect.any(Function),
    );
    expect(mockPort.addListener).toHaveBeenCalledWith(
      'disconnect',
      expect.any(Function),
    );
  });

  it('_write posts non-buffer messages', (done) => {
    const stream = new PortDuplexStream(mockPort, 'https://example.com');
    const msg = { type: 'test', data: 'hello' };

    stream._write(msg, 'utf8', (err) => {
      expect(err).toBeUndefined();
      expect(mockPort.postMessage).toHaveBeenCalledWith(
        msg,
        'https://example.com',
      );
      done();
    });
  });

  it('_write returns error when port throws', (done) => {
    mockPort.postMessage.mockImplementation(() => {
      throw new Error('disconnected');
    });

    const stream = new PortDuplexStream(mockPort, 'https://example.com');
    stream._write({ data: 'test' }, 'utf8', (err) => {
      expect(err).toBeDefined();
      expect(err.message).toBe('PortDuplexStream - disconnected');
      done();
    });
  });

  it('_onMessage pushes non-buffer messages', () => {
    const stream = new PortDuplexStream(mockPort, 'https://example.com');
    const pushSpy = jest.spyOn(stream, 'push').mockImplementation(() => true);
    const msg = { type: 'test' };

    stream._onMessage(msg);
    expect(pushSpy).toHaveBeenCalledWith(msg);
  });

  it('is an instance of Duplex stream', () => {
    const stream = new PortDuplexStream(mockPort, 'https://example.com');
    expect(stream.readable).toBe(true);
    expect(stream.writable).toBe(true);
  });
});
