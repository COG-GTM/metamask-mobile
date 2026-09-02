'use strict';

// eslint-disable-next-line import/no-nodejs-modules
import { EventEmitter } from 'events';
const hub = new EventEmitter();

export type DrawerStatus = 'open' | 'closed';

class DrawerStatusTracker {
  open = false;
  setStatus(status: DrawerStatus) {
    if (status === 'open') {
      this.open = true;
    } else {
      this.open = false;
    }

    hub.emit(`drawer::${status}`);
  }
}

let instance: DrawerStatusTracker | null = null;

const getInstance = (): DrawerStatusTracker => {
  if (!instance) {
    throw new Error('DrawerStatusTracker not initialized');
  }
  return instance;
};

const SharedDrawerStatusTracker = {
  init: () => {
    instance = new DrawerStatusTracker();
  },
  setStatus: (status: DrawerStatus) => {
    getInstance().setStatus(status);
  },
  getStatus: (): DrawerStatus => (getInstance().open ? 'open' : 'closed'),
  hub,
};

export default SharedDrawerStatusTracker;
