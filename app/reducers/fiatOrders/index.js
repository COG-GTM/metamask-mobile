
import { createSelector } from 'reselect';

import { selectChainId } from '../../selectors/networkController';
import { selectSelectedInternalAccountFormattedAddress } from '../../selectors/accountsController';
import {
  FIAT_ORDER_PROVIDERS,
  FIAT_ORDER_STATES } from
'../../constants/on-ramp';
import {

  ACTIONS } from



'./types';

import { getDecimalChainId, isTestNet } from '../../util/networks';
import { toHex } from '@metamask/controller-utils';



/** Action Creators */

export const resetFiatOrders = () => ({
  type: ACTIONS.FIAT_RESET
});
export const addFiatOrder = (order) => ({
  type: ACTIONS.FIAT_ADD_ORDER,
  payload: order
});
export const removeFiatOrder = (order) => ({
  type: ACTIONS.FIAT_REMOVE_ORDER,
  payload: order
});
export const updateFiatOrder = (order) => ({
  type: ACTIONS.FIAT_UPDATE_ORDER,
  payload: order
});
export const setFiatOrdersRegionAGG = (region) => ({
  type: ACTIONS.FIAT_SET_REGION_AGG,
  payload: region
});
export const setFiatOrdersPaymentMethodAGG = (
paymentMethodId) => (
{
  type: ACTIONS.FIAT_SET_PAYMENT_METHOD_AGG,
  payload: paymentMethodId
});
export const setFiatOrdersGetStartedAGG = (getStartedFlag) => ({
  type: ACTIONS.FIAT_SET_GETSTARTED_AGG,
  payload: getStartedFlag
});
export const setFiatOrdersGetStartedSell = (getStartedFlag) => ({
  type: ACTIONS.FIAT_SET_GETSTARTED_SELL,
  payload: getStartedFlag
});
export const addFiatCustomIdData = (customIdData) => ({
  type: ACTIONS.FIAT_ADD_CUSTOM_ID_DATA,
  payload: customIdData
});
export const updateFiatCustomIdData = (customIdData) => ({
  type: ACTIONS.FIAT_UPDATE_CUSTOM_ID_DATA,
  payload: customIdData
});
export const removeFiatCustomIdData = (customIdData) => ({
  type: ACTIONS.FIAT_REMOVE_CUSTOM_ID_DATA,
  payload: customIdData
});
export const addAuthenticationUrl = (authenticationUrl) => ({
  type: ACTIONS.FIAT_ADD_AUTHENTICATION_URL,
  payload: authenticationUrl
});
export const removeAuthenticationUrl = (authenticationUrl) => ({
  type: ACTIONS.FIAT_REMOVE_AUTHENTICATION_URL,
  payload: authenticationUrl
});
export const addActivationKey = (activationKey, label) => ({
  type: ACTIONS.FIAT_ADD_ACTIVATION_KEY,
  payload: { key: activationKey, label }
});
export const removeActivationKey = (activationKey) => ({
  type: ACTIONS.FIAT_REMOVE_ACTIVATION_KEY,
  payload: activationKey
});
export const updateActivationKey = (
activationKey,
label,
active) => (
{
  type: ACTIONS.FIAT_UPDATE_ACTIVATION_KEY,
  payload: { key: activationKey, active, label }
});

export const updateOnRampNetworks = (
networks) => (
{
  type: ACTIONS.FIAT_UPDATE_NETWORKS,
  payload: networks
});

export const setFiatSellTxHash = (orderId, txHash) => ({
  type: ACTIONS.FIAT_SET_SELL_TX_HASH,
  payload: { orderId, txHash }
});

export const removeFiatSellTxHash = (orderId) => ({
  type: ACTIONS.FIAT_REMOVE_SELL_TX_HASH,
  payload: orderId
});

/**
 * Selectors
 */

/**
 * Get the provider display name
 * @param {FIAT_ORDER_PROVIDERS} provider
 */
export const getProviderName = (
provider,
data) =>
{
  switch (provider) {
    case FIAT_ORDER_PROVIDERS.WYRE:
    case FIAT_ORDER_PROVIDERS.WYRE_APPLE_PAY:{
        return 'Wyre';
      }
    case FIAT_ORDER_PROVIDERS.TRANSAK:{
        return 'Transak';
      }
    case FIAT_ORDER_PROVIDERS.MOONPAY:{
        return 'MoonPay';
      }
    case FIAT_ORDER_PROVIDERS.AGGREGATOR:{
        const providerName = data.provider?.name;
        return providerName ? `${providerName}` : '...';
      }
    default:{
        return provider;
      }
  }
};

const ordersSelector = (state) =>
state.fiatOrders.orders || [];
export const chainIdSelector = (
state) =>
getDecimalChainId(selectChainId(state));
export const selectedAddressSelector =

(state) =>
selectSelectedInternalAccountFormattedAddress(state);
export const fiatOrdersRegionSelectorAgg =

(state) =>
state.fiatOrders.selectedRegionAgg;
export const fiatOrdersPaymentMethodSelectorAgg =

(state) =>
state.fiatOrders.selectedPaymentMethodAgg;
export const fiatOrdersGetStartedAgg =

(state) =>
state.fiatOrders.getStartedAgg;
export const fiatOrdersGetStartedSell =

(state) =>
state.fiatOrders.getStartedSell;

export const getOrdersProviders = createSelector(ordersSelector, (orders) => {
  const providers = orders.
  filter(
    (order) =>
    order.provider === FIAT_ORDER_PROVIDERS.AGGREGATOR &&
    order.state === FIAT_ORDER_STATES.COMPLETED &&
    order.data?.provider?.id
  ).
  map((order) => order.data.provider.id);
  return Array.from(new Set(providers));
});

export const getOrders = createSelector(
  ordersSelector,
  selectedAddressSelector,
  chainIdSelector,
  (orders, selectedAddress, chainId) =>
  orders.filter(
    (order) =>
    !order.excludeFromPurchases &&
    order.account === selectedAddress && (
    order.network === chainId || isTestNet(toHex(chainId)))
  )
);

export const getPendingOrders = createSelector(
  ordersSelector,
  selectedAddressSelector,
  chainIdSelector,
  (orders, selectedAddress, chainId) =>
  orders.filter(
    (order) =>
    order.account === selectedAddress &&
    order.network === chainId &&
    order.state === FIAT_ORDER_STATES.PENDING
  )
);

const customOrdersSelector =

(state) =>
state.fiatOrders.customOrderIds || [];

export const getCustomOrderIds = createSelector(
  customOrdersSelector,
  selectedAddressSelector,
  chainIdSelector,
  (customOrderIds, selectedAddress, chainId) =>
  customOrderIds.filter(
    (customOrderId) =>
    customOrderId.account === selectedAddress &&
    customOrderId.chainId === chainId
  )
);

export const getOrderById =


createSelector(
  [ordersSelector, (_state, orderId) => orderId],
  (orders, orderId) => orders.find((order) => order.id === orderId)
);

export const getAuthenticationUrls =

(state) =>
state.fiatOrders.authenticationUrls || [];

export const getActivationKeys =

(state) =>
state.fiatOrders.activationKeys || [];

export const getHasOrders = createSelector(
  getOrders,
  (orders) => orders.length > 0
);

export const getRampNetworks =

(state) =>
state.fiatOrders.networks || [];

export const networkShortNameSelector = createSelector(
  chainIdSelector,
  getRampNetworks,
  (chainId, networks) => {
    const network = networks.find(
      (aggregatorNetwork) => aggregatorNetwork.chainId === chainId
    );

    return network?.shortName;
  }
);

export const initialState = {
  orders: [],
  customOrderIds: [],
  networks: [],
  selectedRegionAgg: null,
  selectedPaymentMethodAgg: null,
  getStartedAgg: false,
  getStartedSell: false,
  authenticationUrls: [],
  activationKeys: []
};

const findOrderIndex = (
provider,
id,
orders) =>

orders.findIndex((order) => order.id === id && order.provider === provider);

const findCustomIdIndex = (
id,
customOrderIds) =>
customOrderIds.findIndex((customOrderId) => customOrderId.id === id);

const fiatOrderReducer =


(state = initialState, action = { type: null }) => {
  switch (action.type) {
    case ACTIONS.FIAT_ADD_ORDER:{
        const orders = state.orders;
        const order = action.payload;
        const index = findOrderIndex(order.provider, order.id, orders);
        if (index !== -1) {
          return state;
        }
        return {
          ...state,
          orders: [action.payload, ...state.orders]
        };
      }
    case ACTIONS.FIAT_UPDATE_ORDER:{
        const orders = state.orders;
        const order = action.payload;
        const index = findOrderIndex(order.provider, order.id, orders);
        if (index === -1) {
          return state;
        }
        return {
          ...state,
          orders: [
          ...orders.slice(0, index),
          {
            ...orders[index],
            ...order
          },
          ...orders.slice(index + 1)]

        };
      }
    case ACTIONS.FIAT_REMOVE_ORDER:{
        const orders = state.orders;
        const order = action.payload;
        const index = findOrderIndex(order.provider, order.id, state.orders);
        if (index === -1) {
          return state;
        }

        return {
          ...state,
          orders: [...orders.slice(0, index), ...orders.slice(index + 1)]
        };
      }
    case ACTIONS.FIAT_RESET:{
        return initialState;
      }
    case ACTIONS.FIAT_SET_GETSTARTED_AGG:{
        return {
          ...state,
          getStartedAgg: action.payload
        };
      }
    case ACTIONS.FIAT_SET_GETSTARTED_SELL:{
        return {
          ...state,
          getStartedSell: action.payload
        };
      }
    case ACTIONS.FIAT_SET_REGION_AGG:{
        return {
          ...state,
          selectedRegionAgg: action.payload
        };
      }
    case ACTIONS.FIAT_SET_PAYMENT_METHOD_AGG:{
        return {
          ...state,
          selectedPaymentMethodAgg: action.payload
        };
      }
    case ACTIONS.FIAT_ADD_CUSTOM_ID_DATA:{
        const customOrderIds = state.customOrderIds;
        const customIdData = action.payload;
        const index = findCustomIdIndex(customIdData.id, customOrderIds);
        if (index !== -1) {
          return state;
        }
        return {
          ...state,
          customOrderIds: [...state.customOrderIds, action.payload]
        };
      }
    case ACTIONS.FIAT_UPDATE_CUSTOM_ID_DATA:{
        const customOrderIds = state.customOrderIds;
        const customIdData = action.payload;
        const index = findCustomIdIndex(customIdData.id, customOrderIds);
        if (index === -1) {
          return state;
        }
        return {
          ...state,
          customOrderIds: [
          ...customOrderIds.slice(0, index),
          {
            ...customOrderIds[index],
            ...customIdData
          },
          ...customOrderIds.slice(index + 1)]

        };
      }
    case ACTIONS.FIAT_REMOVE_CUSTOM_ID_DATA:{
        const customOrderIds = state.customOrderIds;
        const customIdData = action.payload;
        const index = findCustomIdIndex(customIdData.id, customOrderIds);
        if (index === -1) {
          return state;
        }
        return {
          ...state,
          customOrderIds: [
          ...customOrderIds.slice(0, index),
          ...customOrderIds.slice(index + 1)]

        };
      }
    case ACTIONS.FIAT_ADD_AUTHENTICATION_URL:{
        const authenticationUrls = state.authenticationUrls;
        const authenticationUrl = action.payload;
        const index = authenticationUrls.findIndex(
          (url) => url === authenticationUrl
        );
        if (index !== -1) {
          return state;
        }
        return {
          ...state,
          authenticationUrls: [...state.authenticationUrls, authenticationUrl]
        };
      }
    case ACTIONS.FIAT_REMOVE_AUTHENTICATION_URL:{
        const authenticationUrls = state.authenticationUrls;
        const authenticationUrl = action.payload;
        const index = authenticationUrls.findIndex(
          (url) => url === authenticationUrl
        );
        if (index === -1) {
          return state;
        }
        return {
          ...state,
          authenticationUrls: [
          ...authenticationUrls.slice(0, index),
          ...authenticationUrls.slice(index + 1)]

        };
      }
    case ACTIONS.FIAT_ADD_ACTIVATION_KEY:{
        const activationKeys = state.activationKeys;
        const { key, label } = action.payload;
        const index = activationKeys.findIndex(
          (activationKey) => activationKey.key === key
        );
        if (index !== -1) {
          return state;
        }
        return {
          ...state,
          activationKeys: [...state.activationKeys, { key, label, active: true }]
        };
      }
    case ACTIONS.FIAT_REMOVE_ACTIVATION_KEY:{
        const activationKeys = state.activationKeys;
        const key = action.payload;
        const index = activationKeys.findIndex(
          (activationKey) => activationKey.key === key
        );
        if (index === -1) {
          return state;
        }
        return {
          ...state,
          activationKeys: [
          ...activationKeys.slice(0, index),
          ...activationKeys.slice(index + 1)]

        };
      }
    case ACTIONS.FIAT_UPDATE_ACTIVATION_KEY:{
        const activationKeys = state.activationKeys;
        const { key, active, label } = action.payload;
        const index = activationKeys.findIndex(
          (activationKey) => activationKey.key === key
        );
        if (index === -1) {
          return state;
        }
        return {
          ...state,
          activationKeys: [
          ...activationKeys.slice(0, index),
          {
            ...activationKeys[index],
            label: label ?? activationKeys[index].label,
            active
          },
          ...activationKeys.slice(index + 1)]

        };
      }
    case ACTIONS.FIAT_UPDATE_NETWORKS:{
        return {
          ...state,
          networks: action.payload
        };
      }
    case ACTIONS.FIAT_SET_SELL_TX_HASH:{
        const { orderId, txHash } = action.payload;
        const orders = state.orders;
        const index = orders.findIndex((order) => order.id === orderId);
        if (index === -1) {
          return state;
        }
        return {
          ...state,
          orders: [
          ...orders.slice(0, index),
          {
            ...orders[index],
            sellTxHash: txHash
          },
          ...orders.slice(index + 1)]

        };
      }
    case ACTIONS.FIAT_REMOVE_SELL_TX_HASH:{
        const orderId = action.payload;
        const orders = state.orders;
        const index = orders.findIndex((order) => order.id === orderId);
        if (index === -1) {
          return state;
        }
        return {
          ...state,
          orders: [
          ...orders.slice(0, index),
          {
            ...orders[index],
            sellTxHash: undefined
          },
          ...orders.slice(index + 1)]

        };
      }

    default:{
        return state;
      }
  }
};

export default fiatOrderReducer;