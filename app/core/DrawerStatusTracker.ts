'use strict';

// eslint-disable-next-line import/no-nodejs-modules
import { EventEmitter } from 'events';
const hub = new EventEmitter();

class DrawerStatusTracker {
  open = false;
  setStatus(status: 'open' | 'closed'): void {
    if (status === 'open') {
      this.open = true;
    } else {
      this.open = false;
    }

    hub.emit(`drawer::${status}`);
  }
}

let instance: DrawerStatusTracker | null = null;

const SharedDrawerStatusTracker = {
  init: (): void => {
    instance = new DrawerStatusTracker();
  },
  setStatus: (status: 'open' | 'closed'): void => {
    instance!.setStatus(status);
  },
  getStatus: (): 'open' | 'closed' => (instance!.open ? 'open' : 'closed'),
  hub,
};

export default SharedDrawerStatusTracker;
