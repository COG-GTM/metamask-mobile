import { createNavigationDetails } from '../../navigation/navUtils';
import Routes from '../../../constants/navigation/Routes';
import { getDeviceId } from '../../../core/Ledger/Ledger';




















export const signModalNavDetail = async (params) => {
  const deviceId = await getDeviceId();
  return createNavigationDetails(
    Routes.LEDGER_MESSAGE_SIGN_MODAL
  )({
    ...params,
    deviceId
  });
};