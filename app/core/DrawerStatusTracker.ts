'use strict';

// eslint-disable-next-line import/no-nodejs-modules
import { EventEmitter } from 'events';
const hub = new EventEmitter();

type DrawerStatus = 'open' | 'closed';

class DrawerStatusTracker {
  open = false;

  setStatus(status: DrawerStatus): void {
    if (status === 'open') {
      this.open = true;
    } else {
      this.open = false;
    }

    hub.emit(`drawer::${status}`);
  }
}

let instance: DrawerStatusTracker | null = null;

interface SharedDrawerStatusTrackerInterface {
  init: () => void;
  setStatus: (status: DrawerStatus) => void;
  getStatus: () => DrawerStatus;
  hub: EventEmitter;
}

const SharedDrawerStatusTracker: SharedDrawerStatusTrackerInterface = {
  init: () => {
    instance = new DrawerStatusTracker();
  },
  setStatus: (status: DrawerStatus) => {
    instance?.setStatus(status);
  },
  getStatus: () => (instance?.open ? 'open' : 'closed'),
  hub,
};

export default SharedDrawerStatusTracker;
