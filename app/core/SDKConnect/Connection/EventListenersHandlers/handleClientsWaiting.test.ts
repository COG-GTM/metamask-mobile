import handleClientsWaiting from './handleClientsWaiting';

jest.mock('../../utils/DevLogger', () => ({
  __esModule: true,
  default: { log: jest.fn() },
}));

describe('handleClientsWaiting', () => {
  it('should return a function', () => {
    const instance = {
      channelId: 'test-channel',
      setLoading: jest.fn(),
    } as any;

    const handler = handleClientsWaiting({ instance });
    expect(typeof handler).toBe('function');
  });

  it('should call setLoading(false) when invoked', () => {
    const instance = {
      channelId: 'test-channel',
      setLoading: jest.fn(),
    } as any;

    const handler = handleClientsWaiting({ instance });
    handler();
    expect(instance.setLoading).toHaveBeenCalledWith(false);
  });
});
