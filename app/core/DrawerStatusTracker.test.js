import DrawerStatusTracker from './DrawerStatusTracker';

describe('DrawerStatusTracker', () => {
  beforeEach(() => {
    DrawerStatusTracker.init();
  });

  it('starts closed', () => {
    expect(DrawerStatusTracker.getStatus()).toBe('closed');
  });

  it('tracks status changes and emits events', () => {
    const onOpen = jest.fn();
    const onClose = jest.fn();
    DrawerStatusTracker.hub.on('drawer::open', onOpen);
    DrawerStatusTracker.hub.on('drawer::closed', onClose);

    DrawerStatusTracker.setStatus('open');
    expect(DrawerStatusTracker.getStatus()).toBe('open');
    expect(onOpen).toHaveBeenCalledTimes(1);

    DrawerStatusTracker.setStatus('closed');
    expect(DrawerStatusTracker.getStatus()).toBe('closed');
    expect(onClose).toHaveBeenCalledTimes(1);

    DrawerStatusTracker.hub.removeAllListeners();
  });
});
