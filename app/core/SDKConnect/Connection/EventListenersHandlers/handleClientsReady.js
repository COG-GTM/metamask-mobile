
import Routes from '../../../../constants/navigation/Routes';
import AppConstants from '../../../../core/AppConstants';
import Logger from '../../../../util/Logger';
import Engine from '../../../Engine';
import SDKConnect from '../../SDKConnect';
import handleConnectionReady from '../../handlers/handleConnectionReady';
import DevLogger from '../../utils/DevLogger';


function handleClientsReady({
  instance,
  disapprove,
  updateOriginatorInfos,
  approveHost








}) {
  return async (clientsReadyMsg) => {
    try {
      await handleConnectionReady({
        originatorInfo:
        clientsReadyMsg?.originatorInfo ?? instance.originatorInfo,
        engine: Engine,
        updateOriginatorInfos,
        approveHost,
        onError: (error) => {
          Logger.error(error, '');

          instance.setLoading(false);

          // Remove connection from SDK completely
          SDKConnect.getInstance().removeChannel({
            channelId: instance.channelId,
            sendTerminate: true
          });

          // Redirect on deeplinks
          if (
          instance.trigger === 'deeplink' &&
          instance.origin !== AppConstants.DEEPLINKS.ORIGIN_QR_CODE)
          {
            instance.navigation?.navigate(Routes.MODAL.ROOT_MODAL_FLOW, {
              screen: Routes.SHEET.RETURN_TO_DAPP_MODAL
            });
          }
        },
        disapprove,
        connection: instance
      });
    } catch (error) {
      DevLogger.log(`Connection::CLIENTS_READY error`, error);
      instance.setLoading(false);
      // Send error message to user
    }
  };
}

export default handleClientsReady;