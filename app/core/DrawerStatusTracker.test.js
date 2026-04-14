import SharedDrawerStatusTracker from './DrawerStatusTracker';

describe('DrawerStatusTracker', () => {
  beforeEach(() => {
    SharedDrawerStatusTracker.init();
  });

  it('should initialize with closed status', () => {
    expect(SharedDrawerStatusTracker.getStatus()).toBe('closed');
  });

  it('should set status to open', () => {
    SharedDrawerStatusTracker.setStatus('open');
    expect(SharedDrawerStatusTracker.getStatus()).toBe('open');
  });

  it('should set status to closed', () => {
    SharedDrawerStatusTracker.setStatus('open');
    SharedDrawerStatusTracker.setStatus('closed');
    expect(SharedDrawerStatusTracker.getStatus()).toBe('closed');
  });

  it('should emit events on status change', () => {
    const listener = jest.fn();
    SharedDrawerStatusTracker.hub.on('drawer::open', listener);
    SharedDrawerStatusTracker.setStatus('open');
    expect(listener).toHaveBeenCalled();
  });
});
