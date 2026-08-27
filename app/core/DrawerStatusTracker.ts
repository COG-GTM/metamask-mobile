'use strict';

// eslint-disable-next-line import/no-nodejs-modules
import { EventEmitter } from 'events';
const hub = new EventEmitter();

class DrawerStatusTracker {
  open: boolean = false;
  setStatus(status: string): void {
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
  setStatus: (status: string): void => {
    (instance as DrawerStatusTracker).setStatus(status);
  },
  getStatus: (): 'open' | 'closed' =>
    (instance as DrawerStatusTracker).open ? 'open' : 'closed',
  hub,
};

export default SharedDrawerStatusTracker;
