
import Logger from '../../../../util/Logger';
import Engine from '../../../Engine';
import { handleConnectionMessage } from '../../handlers/handleConnectionMessage';


function handleReceivedMessage({ instance }) {
  return async (message) => {
    try {
      await handleConnectionMessage({
        message,
        engine: Engine,
        connection: instance
      });
    } catch (error) {
      Logger.error(error, 'Connection not initialized');
      throw error;
    }
  };
}

export default handleReceivedMessage;