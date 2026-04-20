import handleClientsWaiting from './handleClientsWaiting';
import DevLogger from '../../utils/DevLogger';
import { Connection } from '../Connection';

jest.mock('../../utils/DevLogger');

describe('handleClientsWaiting', () => {
  let instance: Connection;
  const setLoading = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    instance = {
      channelId: 'channel-1',
      setLoading,
    } as unknown as Connection;
  });

  it('returns a function that sets the instance loading state to false', () => {
    const handler = handleClientsWaiting({ instance });

    expect(typeof handler).toBe('function');
    expect(setLoading).not.toHaveBeenCalled();

    handler();

    expect(setLoading).toHaveBeenCalledWith(false);
    expect(setLoading).toHaveBeenCalledTimes(1);
  });

  it('logs the channel id via DevLogger', () => {
    handleClientsWaiting({ instance })();

    expect(DevLogger.log).toHaveBeenCalledWith(
      'handleClientsWaiting:: dapp not connected',
      'channel-1',
    );
  });
});
