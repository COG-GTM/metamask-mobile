import {

  Messenger } from


'@metamask/base-controller';

export class ExtendedControllerMessenger extends


Messenger {
  subscribeOnceIf(
  eventType,
  handler,
  criteria)


  {
    const internalHandler = (...data) => {
      if (!criteria || criteria(...data)) {
        this.tryUnsubscribe(eventType, internalHandler);
        handler(...data);
      }
    };

    this.subscribe(eventType, internalHandler);

    return internalHandler;
  }

  tryUnsubscribe(
  eventType,
  handler)
  {
    if (!handler) {
      return;
    }

    try {
      this.unsubscribe(eventType, handler);
    } catch (e) {

      // Ignore
    }}
}