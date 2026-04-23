import {
  TokenDetectionController,
  TokenDetectionControllerMessenger,
} from '@metamask/assets-controllers';
import type { ControllerInitFunction } from '../../types';
import { MetaMetrics, MetaMetricsEvents } from '../../../Analytics';
import { MetricsEventBuilder } from '../../../Analytics/MetricsEventBuilder';
import { getDecimalChainId } from '../../../../util/networks';
import {
  getGlobalChainId,
} from '../../../../util/networks/global-network';

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
  const { controllerMessenger, getController } = request;

  const networkController = getController('NetworkController');
  const assetsContractController = getController('AssetsContractController');

  const controller = new TokenDetectionController({
    messenger: controllerMessenger,
    trackMetaMetricsEvent: () =>
      MetaMetrics.getInstance().trackEvent(
        MetricsEventBuilder.createEventBuilder(
          MetaMetricsEvents.TOKEN_DETECTED,
        )
          .addProperties({
            token_standard: 'ERC20',
            asset_type: 'token',
            chain_id: getDecimalChainId(
              getGlobalChainId(networkController),
            ),
          })
          .build(),
      ),
    getBalancesInSingleCall:
      assetsContractController.getBalancesInSingleCall.bind(
        assetsContractController,
      ),
    platform: 'mobile',
    useAccountsAPI: true,
    disabled: false,
  });

  return { controller };
};
