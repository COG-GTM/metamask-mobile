import {
  TokenDetectionController,
  TokenDetectionControllerMessenger,
} from '@metamask/assets-controllers';
import MetaMetrics from '../../../Analytics/MetaMetrics';
import { MetricsEventBuilder } from '../../../Analytics/MetricsEventBuilder';
import { MetaMetricsEvents } from '../../../Analytics/MetaMetrics.events';
import { getDecimalChainId } from '../../../../util/networks';
import type { ControllerInitFunction } from '../../types';

/**
 * Initialize the TokenDetectionController.
 *
 * @param request - The request object.
 * @returns The TokenDetectionController.
 */
export const tokenDetectionControllerInit: ControllerInitFunction<
  TokenDetectionController,
  TokenDetectionControllerMessenger
> = (request) => {
  const { controllerMessenger, getController, getGlobalChainId } = request;

  const tokenDetectionController = new TokenDetectionController({
    messenger: controllerMessenger,
    trackMetaMetricsEvent: () =>
      MetaMetrics.getInstance().trackEvent(
        MetricsEventBuilder.createEventBuilder(
          MetaMetricsEvents.TOKEN_DETECTED,
        )
          .addProperties({
            token_standard: 'ERC20',
            asset_type: 'token',
            chain_id: getDecimalChainId(getGlobalChainId()),
          })
          .build(),
      ),
    getBalancesInSingleCall: (...args) =>
      getController('AssetsContractController').getBalancesInSingleCall(
        ...args,
      ),
    platform: 'mobile',
    useAccountsAPI: true,
    disabled: false,
  });

  return { controller: tokenDetectionController };
};
