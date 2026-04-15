import { MessageType } from '@metamask/sdk-communication-layer';
import Logger from '../../../../util/Logger';


function sendAuthorized({
  force,
  instance



}) {
  if (instance.authorizedSent && force !== true) {
    // Prevent double sending authorized event.
    return;
  }

  instance.remote.
  sendMessage({ type: MessageType.AUTHORIZED }).
  then(() => {
    instance.authorizedSent = true;
  }).
  catch((err) => {
    Logger.log(err, `sendAuthorized() failed to send 'authorized'`);
  });
}

export default sendAuthorized;