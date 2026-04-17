import SharedDrawerStatusTracker from './DrawerStatusTracker';

describe('DrawerStatusTracker', () => {
  beforeEach(() => {
    SharedDrawerStatusTracker.init();
  });

  it('initializes with closed status', () => {
    expect(SharedDrawerStatusTracker.getStatus()).toBe('closed');
  });

  it('sets status to open', () => {
    SharedDrawerStatusTracker.setStatus('open');
    expect(SharedDrawerStatusTracker.getStatus()).toBe('open');
  });

  it('sets status to closed', () => {
    SharedDrawerStatusTracker.setStatus('open');
    SharedDrawerStatusTracker.setStatus('closed');
    expect(SharedDrawerStatusTracker.getStatus()).toBe('closed');
  });

  it('emits events on status change', () => {
    const listener = jest.fn();
    SharedDrawerStatusTracker.hub.on('drawer::open', listener);
    SharedDrawerStatusTracker.setStatus('open');
    expect(listener).toHaveBeenCalled();
    SharedDrawerStatusTracker.hub.removeListener('drawer::open', listener);
  });

  it('has a hub EventEmitter', () => {
    expect(SharedDrawerStatusTracker.hub).toBeDefined();
    expect(typeof SharedDrawerStatusTracker.hub.on).toBe('function');
  });
});
