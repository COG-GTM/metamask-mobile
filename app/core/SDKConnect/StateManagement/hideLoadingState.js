import Routes from '../../../constants/navigation/Routes';

import DevLogger from '../utils/DevLogger';

async function hideLoadingState({ instance }) {
  instance.state.sdkLoadingState = {};
  const currentRoute = instance.state.navigation?.getCurrentRoute()?.name;
  DevLogger.log(`SDKConnect::hideLoadingState currentRoute=${currentRoute}`);
  if (
  currentRoute === Routes.SHEET.SDK_LOADING &&
  instance.state.navigation?.canGoBack())
  {
    instance.state.navigation?.goBack();
  } else {
    DevLogger.log(
      `SDKConnect::hideLoadingState - SKIP - currentRoute=${currentRoute}`
    );
  }
}

export default hideLoadingState;