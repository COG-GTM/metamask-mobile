import React, { useCallback } from 'react';
import { InteractionManager, StyleSheet, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';

import { OrderOrderTypeEnum } from '@consensys/on-ramp-sdk/dist/API';
import WebView from '@metamask/react-native-webview';
import AppConstants from '../../../core/AppConstants';
import NotificationManager from '../../../core/NotificationManager';
import { FIAT_ORDER_STATES } from '../../../constants/on-ramp';
import {

  getPendingOrders,
  addFiatOrder,
  updateFiatOrder,
  getCustomOrderIds,
  removeFiatCustomIdData,
  updateFiatCustomIdData,
  getAuthenticationUrls,
  removeAuthenticationUrl,
  getOrderById } from
'../../../reducers/fiatOrders';
import useInterval from '../../hooks/useInterval';
import useThunkDispatch from '../../hooks/useThunkDispatch';
import processOrder from './orderProcessor';
import processCustomOrderIdData from './orderProcessor/customOrderId';
import { aggregatorOrderToFiatOrder } from './orderProcessor/aggregator';
import { trackEvent } from './hooks/useAnalytics';


import { callbackBaseUrl } from './sdk';
import useFetchRampNetworks from './hooks/useFetchRampNetworks';
import { getNotificationDetails, stateHasOrder } from './utils';
import Routes from '../../../constants/navigation/Routes';

const POLLING_FREQUENCY = AppConstants.FIAT_ORDERS.POLLING_FREQUENCY;

/**
 * @param {FiatOrder} fiatOrder
 */
export const getAggregatorAnalyticsPayload = (
fiatOrder) =>




















{
  const isBuy = fiatOrder.orderType === OrderOrderTypeEnum.Buy;

  let failedOrCancelledParams;





  if (isBuy) {
    failedOrCancelledParams = {
      amount: fiatOrder.amount,
      currency_source: fiatOrder.currency,
      currency_destination: fiatOrder.cryptocurrency,
      order_type: fiatOrder.orderType,
      payment_method_id: fiatOrder.data?.paymentMethod?.id,
      chain_id_destination: fiatOrder.network,
      provider_onramp: fiatOrder.data?.provider?.name
    };
  } else {
    failedOrCancelledParams = {
      amount: fiatOrder.amount,
      currency_source: fiatOrder.cryptocurrency,
      currency_destination: fiatOrder.currency,
      order_type: fiatOrder.orderType,
      payment_method_id: fiatOrder.data?.paymentMethod?.id,
      chain_id_source: fiatOrder.network,
      provider_offramp: fiatOrder.data?.provider?.name
    };
  }

  const sharedCompletedPayload =


  {
    total_fee: Number(fiatOrder.fee),
    exchange_rate:
    (Number(fiatOrder.amount) - Number(fiatOrder.fee)) /
    Number(fiatOrder.cryptoAmount),
    amount_in_usd: fiatOrder.data?.fiatAmountInUsd
  };

  const sellCompletePayload = {
    ...failedOrCancelledParams,
    ...sharedCompletedPayload,
    fiat_out: fiatOrder.amount
  };

  const buyCompletePayload = {
    ...failedOrCancelledParams,
    ...sharedCompletedPayload,
    crypto_out: fiatOrder.cryptoAmount
  };

  switch (fiatOrder.state) {
    case FIAT_ORDER_STATES.FAILED:{
        return [
        isBuy ? 'ONRAMP_PURCHASE_FAILED' : 'OFFRAMP_PURCHASE_FAILED',
        failedOrCancelledParams];

      }
    case FIAT_ORDER_STATES.CANCELLED:{
        return [
        isBuy ? 'ONRAMP_PURCHASE_CANCELLED' : 'OFFRAMP_PURCHASE_CANCELLED',
        failedOrCancelledParams];

      }
    case FIAT_ORDER_STATES.COMPLETED:{
        return isBuy ?
        ['ONRAMP_PURCHASE_COMPLETED', buyCompletePayload] :
        ['OFFRAMP_PURCHASE_COMPLETED', sellCompletePayload];
      }
    case FIAT_ORDER_STATES.PENDING:
    default:{
        return [null, null];
      }
  }
};





export async function processFiatOrder(
order,
dispatchUpdateFiatOrder,
dispatchThunk,
options)
{
  const updatedOrder = await processOrder(order, options);
  dispatchThunk((_dispatch, getState) => {
    const state = getState();
    const existingOrder = getOrderById(state, updatedOrder.id);
    if (existingOrder?.state !== updatedOrder.state) {
      const [event, params] = getAggregatorAnalyticsPayload(updatedOrder);
      if (event && params) {
        trackEvent(event, params);
      }
      InteractionManager.runAfterInteractions(() => {
        const notificationDetails = getNotificationDetails(updatedOrder);
        if (notificationDetails) {
          NotificationManager.showSimpleNotification(notificationDetails);
        }
      });
    }
    dispatchUpdateFiatOrder(updatedOrder);
  });
}

async function processCustomOrderId(
customOrderIdData,
{
  dispatchUpdateFiatCustomIdData,
  dispatchRemoveFiatCustomIdData,
  dispatchAddFiatOrder,
  dispatchThunk





})
{
  const [customOrderId, fiatOrderResponse] = await processCustomOrderIdData(
    customOrderIdData
  );

  if (fiatOrderResponse) {
    const fiatOrder = aggregatorOrderToFiatOrder(fiatOrderResponse);
    dispatchThunk((_, getState) => {
      const state = getState();
      if (stateHasOrder(state, fiatOrder)) {
        return;
      }
      dispatchAddFiatOrder(fiatOrder);
      InteractionManager.runAfterInteractions(() => {
        const notificationDetails = getNotificationDetails(fiatOrder);
        if (notificationDetails) {
          NotificationManager.showSimpleNotification(notificationDetails);
        }
      });
    });
    dispatchRemoveFiatCustomIdData(customOrderIdData);
  } else if (customOrderId.expired) {
    dispatchRemoveFiatCustomIdData(customOrderId);
  } else {
    dispatchUpdateFiatCustomIdData(customOrderId);
  }
}

const styles = StyleSheet.create({
  hiddenView: {
    height: 0,
    width: 0
  }
});

function FiatOrders() {
  useFetchRampNetworks();
  const dispatch = useDispatch();
  const dispatchThunk = useThunkDispatch();
  const navigation = useNavigation();
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pendingOrders = useSelector(getPendingOrders);
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const customOrderIds = useSelector(getCustomOrderIds);
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const authenticationUrls = useSelector(getAuthenticationUrls);

  const dispatchAddFiatOrder = useCallback(
    (order) => {
      dispatchThunk((_dispatch, getState) => {
        const state = getState();
        if (stateHasOrder(state, order)) {
          return;
        }
        _dispatch(addFiatOrder(order));
        if (order.orderType === OrderOrderTypeEnum.Sell) {
          navigation.navigate(Routes.TRANSACTIONS_VIEW, {
            screen: Routes.RAMP.ORDER_DETAILS,
            initial: false,
            params: {
              orderId: order.id,
              redirectToSendTransaction: true
            }
          });
        }
      });
    },
    [dispatchThunk, navigation]
  );
  const dispatchUpdateFiatOrder = useCallback(
    (order) => dispatch(updateFiatOrder(order)),
    [dispatch]
  );
  const dispatchUpdateFiatCustomIdData = useCallback(
    (customIdData) =>
    dispatch(updateFiatCustomIdData(customIdData)),
    [dispatch]
  );
  const dispatchRemoveFiatCustomIdData = useCallback(
    (customIdData) =>
    dispatch(removeFiatCustomIdData(customIdData)),
    [dispatch]
  );

  useInterval(
    async () => {
      await Promise.all(
        pendingOrders.map((order) =>
        processFiatOrder(order, dispatchUpdateFiatOrder, dispatchThunk)
        )
      );
    },
    { delay: pendingOrders.length ? POLLING_FREQUENCY : null, immediate: true }
  );

  useInterval(
    async () => {
      await Promise.all(
        customOrderIds.map((customOrderIdData) =>
        processCustomOrderId(customOrderIdData, {
          dispatchUpdateFiatCustomIdData,
          dispatchRemoveFiatCustomIdData,
          dispatchAddFiatOrder,
          dispatchThunk
        })
        )
      );
    },
    {
      delay: customOrderIds.length ? POLLING_FREQUENCY : null,
      immediate: true
    }
  );

  const handleNavigationStateChange = useCallback(
    async (navState, authenticationUrl) => {
      if (
      navState.url.startsWith(callbackBaseUrl) &&
      navState.loading === false)
      {
        dispatch(removeAuthenticationUrl(authenticationUrl));
      }
    },
    [dispatch]
  );

  return authenticationUrls.length > 0 ?
  <View style={styles.hiddenView}>
      {authenticationUrls.map((url) => (
    /*
     * WebView is used to redirect to the authenticationUrl
     * but is not visible to the user
     * */
    <WebView
      key={url}
      style={styles.hiddenView}
      source={{ uri: url }}
      onNavigationStateChange={(navState) =>
      handleNavigationStateChange(navState, url)
      }
      onHttpError={() => dispatch(removeAuthenticationUrl(url))} />)

    )}
    </View> :
  null;
}

export default FiatOrders;