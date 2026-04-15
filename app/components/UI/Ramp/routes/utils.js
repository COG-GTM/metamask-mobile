import { RampType } from '../types';
import Routes from '../../../../constants/navigation/Routes';

function createRampNavigationDetails(rampType, intent) {
  const route = rampType === RampType.BUY ? Routes.RAMP.BUY : Routes.RAMP.SELL;
  if (!intent) {
    return [route];
  }
  return [route, { screen: Routes.RAMP.GET_STARTED, params: intent }];
}

export function createBuyNavigationDetails(intent) {
  return createRampNavigationDetails(RampType.BUY, intent);
}

export function createSellNavigationDetails(intent) {
  return createRampNavigationDetails(RampType.SELL, intent);
}