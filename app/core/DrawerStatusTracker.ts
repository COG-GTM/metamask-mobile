'use strict';

// eslint-disable-next-line import/no-nodejs-modules
import { EventEmitter } from 'events';
const hub = new EventEmitter();

class DrawerStatusTracker {
  open = false;
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
    instance.setStatus(status);
  },
  getStatus: (): string => (instance!.open ? 'open' : 'closed'),
  hub,
};

export default SharedDrawerStatusTracker;
