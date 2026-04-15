
import { FIAT_ORDER_PROVIDERS } from '../../../../constants/on-ramp';

import Logger from '../../../../util/Logger';
import { processAggregatorOrder } from './aggregator';

function processOrder(
order,
options)
{
  switch (order.provider) {
    case FIAT_ORDER_PROVIDERS.WYRE_APPLE_PAY:
    case FIAT_ORDER_PROVIDERS.TRANSAK:
    case FIAT_ORDER_PROVIDERS.MOONPAY:{
        return order;
      }
    case FIAT_ORDER_PROVIDERS.AGGREGATOR:{
        return processAggregatorOrder(order, options);
      }
    default:{
        const unrecognizedProviderError = new Error(
          'FiatOrders::ProcessOrder unrecognized provider'
        );
        Logger.error(unrecognizedProviderError, order);
        return order;
      }
  }
}

export default processOrder;