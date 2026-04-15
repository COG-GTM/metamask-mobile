





import {

  OrderOrderTypeEnum } from


'@consensys/on-ramp-sdk/dist/API';
import {
  renderFromTokenMinimalUnit,
  renderNumber,
  toTokenMinimalUnit } from
'../../../../util/number';
import { RampType } from '../types';
import { getOrders } from '../../../../reducers/fiatOrders';

import { FIAT_ORDER_STATES } from '../../../../constants/on-ramp';
import { strings } from '../../../../../locales/i18n';
import { getDecimalChainId } from '../../../../util/networks';


const isOverAnHour = (minutes) => minutes > 59;

const isOverADay = (minutes) => minutes > 1439;

const toDay = (minutes) => Math.round(minutes / 1440);
const toHour = (minutes) => Math.round(minutes / 60);

export let TimeDescriptions = /*#__PURE__*/function (TimeDescriptions) {TimeDescriptions[TimeDescriptions["instant"] = 0] = "instant";TimeDescriptions[TimeDescriptions["less_than"] = 1] = "less_than";TimeDescriptions[TimeDescriptions["separator"] = 2] = "separator";TimeDescriptions[TimeDescriptions["minutes"] = 3] = "minutes";TimeDescriptions[TimeDescriptions["minute"] = 4] = "minute";TimeDescriptions[TimeDescriptions["hours"] = 5] = "hours";TimeDescriptions[TimeDescriptions["hour"] = 6] = "hour";TimeDescriptions[TimeDescriptions["business_days"] = 7] = "business_days";TimeDescriptions[TimeDescriptions["business_day"] = 8] = "business_day";return TimeDescriptions;}({});










export const timeToDescription = (timeArr) => {
  const [lower, upper] = timeArr;
  if (lower === 0 && upper === 0) {
    return [TimeDescriptions.instant];
  }
  if (lower === 0) {
    if (isOverADay(upper)) {
      if (toDay(upper) === 1) {
        return [
        TimeDescriptions.less_than,
        toDay(upper).toString(),
        TimeDescriptions.business_day];

      }
      return [
      TimeDescriptions.less_than,
      toDay(upper).toString(),
      TimeDescriptions.business_days];

    } else if (isOverAnHour(upper)) {
      if (toHour(upper) === 1) {
        return [
        TimeDescriptions.less_than,
        toHour(upper).toString(),
        TimeDescriptions.hour];

      }
      return [
      TimeDescriptions.less_than,
      toHour(upper).toString(),
      TimeDescriptions.hours];

    }
    if (upper === 1) {
      return [
      TimeDescriptions.less_than,
      upper.toString(),
      TimeDescriptions.minute];

    }
    return [
    TimeDescriptions.less_than,
    upper.toString(),
    TimeDescriptions.minutes];

  } else if (isOverADay(lower)) {
    return [
    toDay(lower).toString(),
    TimeDescriptions.separator,
    toDay(upper).toString(),
    TimeDescriptions.business_days];

  } else if (isOverAnHour(lower)) {
    return [
    toHour(lower).toString(),
    TimeDescriptions.separator,
    toHour(upper).toString(),
    TimeDescriptions.hours];

  }
  return [
  lower.toString(),
  TimeDescriptions.separator,
  upper.toString(),
  TimeDescriptions.minutes];

};

export const formatId = (id) => {
  if (!id) {
    return id;
  }

  return id.startsWith('/') ? id : '/' + id;
};

export function formatAmount(amount, useParts = false) {
  try {
    if (Intl?.NumberFormat) {
      if (useParts) {
        return new Intl.NumberFormat().
        formatToParts(amount).
        map(({ type, value }) => type === 'integer' ? value : '').
        join(' ');
      }
      return new Intl.NumberFormat().format(amount);
    }
    return String(amount);
  } catch (e) {
    return String(amount);
  }
}

export function isNetworkRampSupported(
chainId,
networks)
{
  return (
    networks?.find((network) => network.chainId === getDecimalChainId(chainId))?.
    active ?? false);

}

export function isNetworkRampNativeTokenSupported(
chainId,
networks)
{
  const network = networks?.find(
    (_network) => _network.chainId === getDecimalChainId(chainId)
  );
  return (network?.active && network.nativeTokenSupported) ?? false;
}

export function getOrderAmount(order) {
  let amount = '...';
  if (order.cryptoAmount) {
    const data = order?.data;
    if (data?.cryptoCurrency?.decimals !== undefined && order.cryptocurrency) {
      amount = renderFromTokenMinimalUnit(
        toTokenMinimalUnit(
          order.cryptoAmount,
          data.cryptoCurrency.decimals
        ).toString(),
        data.cryptoCurrency.decimals
      );
    } else {
      amount = renderNumber(String(order.cryptoAmount));
    }
  }
  return amount;
}

export function stateHasOrder(state, order) {
  const orders = getOrders(state);
  return orders.some((o) => o.id === order.id);
}

export function isBuyQuotes(
buyOrSellQuotes,


rampType)
{
  return rampType === RampType.BUY;
}

export function isSellQuotes(
buyOrSellQuotes,


rampType)
{
  return rampType === RampType.SELL;
}

export function isBuyQuote(
quote,
rampType)
{
  return rampType === RampType.BUY;
}

export function isSellQuote(
quote,
rampType)
{
  return rampType === RampType.SELL;
}

export function isSellOrder(order) {
  return order.orderType === OrderOrderTypeEnum.Sell;
}

export function isSellFiatOrder(order) {
  return order.orderType === OrderOrderTypeEnum.Sell;
}
export function sortQuotes(


quotes,
sortingArray,
quoteSortBy)
{
  if (!quotes || !sortingArray) {
    return quotes;
  }

  const sortOrder = sortingArray.find((s) => s.sortBy === quoteSortBy)?.ids;

  if (!sortOrder) {
    return quotes;
  }

  const sortOrderMap = new Map(sortOrder.map((id, index) => [id, index]));

  return [...quotes].sort(
    (a, b) =>
    (sortOrderMap.get(a.provider.id) ?? 0) - (
    sortOrderMap.get(b.provider.id) ?? 0)
  );
}

const NOTIFICATION_DURATION = 5000;

const baseNotificationDetails = {
  duration: NOTIFICATION_DURATION
};

/**
 * @param {FiatOrder} fiatOrder
 */
export const getNotificationDetails = (fiatOrder) => {
  switch (fiatOrder.state) {
    case FIAT_ORDER_STATES.FAILED:{
        if (fiatOrder.orderType === OrderOrderTypeEnum.Buy) {
          return {
            ...baseNotificationDetails,
            title: strings(
              'fiat_on_ramp_aggregator.notifications.purchase_failed_title',
              {
                currency: fiatOrder.cryptocurrency
              }
            ),
            description: strings(
              'fiat_on_ramp_aggregator.notifications.purchase_failed_description'
            ),
            status: 'error'
          };
        }
        return {
          ...baseNotificationDetails,
          title: strings(
            'fiat_on_ramp_aggregator.notifications.sale_failed_title'
          ),
          description: strings(
            'fiat_on_ramp_aggregator.notifications.sale_failed_description'
          ),
          status: 'error'
        };
      }
    case FIAT_ORDER_STATES.CANCELLED:{
        if (fiatOrder.orderType === OrderOrderTypeEnum.Buy) {
          return {
            ...baseNotificationDetails,
            title: strings(
              'fiat_on_ramp_aggregator.notifications.purchase_cancelled_title'
            ),
            description: strings(
              'fiat_on_ramp_aggregator.notifications.purchase_cancelled_description'
            ),
            status: 'cancelled'
          };
        }
        return {
          ...baseNotificationDetails,
          title: strings(
            'fiat_on_ramp_aggregator.notifications.sale_cancelled_title'
          ),
          description: strings(
            'fiat_on_ramp_aggregator.notifications.sale_cancelled_description'
          ),
          status: 'cancelled'
        };
      }
    case FIAT_ORDER_STATES.COMPLETED:{
        if (fiatOrder.orderType === OrderOrderTypeEnum.Buy) {
          return {
            ...baseNotificationDetails,
            title: strings(
              'fiat_on_ramp_aggregator.notifications.purchase_completed_title',
              {
                amount: renderNumber(String(fiatOrder.cryptoAmount)),
                currency: fiatOrder.cryptocurrency
              }
            ),
            description: strings(
              'fiat_on_ramp_aggregator.notifications.purchase_completed_description',
              {
                currency: fiatOrder.cryptocurrency
              }
            ),
            status: 'success'
          };
        }
        return {
          ...baseNotificationDetails,
          title: strings(
            'fiat_on_ramp_aggregator.notifications.sale_completed_title'
          ),
          description: strings(
            'fiat_on_ramp_aggregator.notifications.sale_completed_description'
          ),
          status: 'success'
        };
      }
    case FIAT_ORDER_STATES.CREATED:{
        return null;
      }
    case FIAT_ORDER_STATES.PENDING:
    default:{
        if (fiatOrder.orderType === OrderOrderTypeEnum.Buy) {
          return {
            ...baseNotificationDetails,
            title: strings(
              'fiat_on_ramp_aggregator.notifications.purchase_pending_title',
              {
                currency: fiatOrder.cryptocurrency
              }
            ),
            description: strings(
              'fiat_on_ramp_aggregator.notifications.purchase_pending_description'
            ),
            status: 'pending'
          };
        }
        return {
          ...baseNotificationDetails,
          title: strings(
            'fiat_on_ramp_aggregator.notifications.sale_pending_title',
            {
              currency: fiatOrder.cryptocurrency
            }
          ),
          description: strings(
            'fiat_on_ramp_aggregator.notifications.sale_pending_description'
          ),
          status: 'pending'
        };
      }
  }
};