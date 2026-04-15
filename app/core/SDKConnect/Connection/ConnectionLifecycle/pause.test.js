import pause from './pause';


jest.mock('../Connection');

describe('pause', () => {
  let mockConnection;
  const mockRemotePause = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockConnection = {
      remote: {
        pause: mockRemotePause
      },
      isResumed: true
    };
  });

  it('should call pause on the remote object', () => {
    pause({ instance: mockConnection });

    expect(mockRemotePause).toHaveBeenCalledTimes(1);
  });

  it('should set isResumed to false', () => {
    pause({ instance: mockConnection });

    expect(mockConnection.isResumed).toBe(false);
  });
});