import { useCallback } from 'react';
// @ts-expect-error ts(7016) react-native-payments is not typed
import { PaymentRequest } from '@metamask/react-native-payments';

import { strings } from '../../../../../locales/i18n';
import Logger from '../../../../util/Logger';

import {
  ApplePayPurchaseStatus } from

'@consensys/on-ramp-sdk/dist/ApplePay';

//* Payment Request */

export const ABORTED = 'ABORTED';var
PAYMENT_REQUEST_COMPLETE = /*#__PURE__*/function (PAYMENT_REQUEST_COMPLETE) {PAYMENT_REQUEST_COMPLETE["SUCCESS"] = "success";PAYMENT_REQUEST_COMPLETE["UNKNOWN"] = "unknown";PAYMENT_REQUEST_COMPLETE["FAIL"] = "fail";return PAYMENT_REQUEST_COMPLETE;}(PAYMENT_REQUEST_COMPLETE || {});





//* Setup */
function createApplePaySetup(quote) {
  return {
    getPurchaseFiatAmountWithoutFeeLabel(crypto) {
      return strings('fiat_on_ramp.apple_pay_purchase', {
        currency: crypto.symbol
      });
    },

    getPurchaseFiatFeeLabel() {
      return strings('fiat_on_ramp.Fee');
    },

    getPurchaseFiatTotalAmountLabel() {
      return strings('fiat_on_ramp.apple_pay_provider_total_label', {
        provider: quote.provider.name
      });
    }
  };
}

function useApplePay(quote) {
  const showRequest = useCallback(async () => {
    if (!quote.getApplePayRequestInfo || !quote.purchaseWithApplePay) {
      throw new Error('Quote does not support Apple Pay');
    }

    const applePaySetup = createApplePaySetup(quote);
    const applePayInfo = quote.getApplePayRequestInfo(applePaySetup);
    const paymentRequest = new PaymentRequest(
      applePayInfo.methodData,
      applePayInfo.paymentDetails,
      applePayInfo.paymentOptions
    );
    try {
      const paymentResponse = await paymentRequest.show();
      if (!paymentResponse) {
        throw new Error('Payment Request Failed: empty apple pay response');
      }

      const purchaseResult = await quote.purchaseWithApplePay(
        paymentResponse.details
      );

      switch (purchaseResult.status) {
        case ApplePayPurchaseStatus.FAILURE:{
            paymentResponse.complete(PAYMENT_REQUEST_COMPLETE.FAIL);
            if (purchaseResult.error?.message) {
              throw purchaseResult.error;
            } else {
              throw new Error(purchaseResult.error);
            }
          }
        case ApplePayPurchaseStatus.SUCCESS:
        case ApplePayPurchaseStatus.PENDING:{
            paymentResponse.complete(PAYMENT_REQUEST_COMPLETE.SUCCESS);
            return {
              order: purchaseResult.order,
              authenticationUrl: purchaseResult.authenticationUrl
            };
          }
      }
    } catch (error) {
      if (error.message.includes('AbortError')) {
        return ABORTED;
      }
      if (paymentRequest?.abort) {
        paymentRequest.abort();
      }
      Logger.error(error, {
        message: 'FiatOnRampAgg::ApplePay error while creating order'
      });
      throw error;
    }
  }, [quote]);

  return [showRequest];
}

export default useApplePay;