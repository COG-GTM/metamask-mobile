
import { OrderOrderTypeEnum } from '@consensys/on-ramp-sdk/dist/API';
import { useNavigation } from '@react-navigation/native';
import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { protectWalletModalVisible } from '../../../../actions/user';
import { NATIVE_ADDRESS } from '../../../../constants/on-ramp';
import Engine from '../../../../core/Engine';
import NotificationManager from '../../../../core/NotificationManager';
import { addFiatOrder } from '../../../../reducers/fiatOrders';
import { toLowerCaseEquals } from '../../../../util/general';
import useThunkDispatch from '../../../hooks/useThunkDispatch';
import { useRampSDK } from '../sdk';
import { getNotificationDetails, stateHasOrder } from '../utils';
import useAnalytics from './useAnalytics';
import { hexToBN, toHexadecimal } from '../../../../util/number';
import { selectAccountsByChainId } from '../../../../selectors/accountTrackerController';
import Routes from '../../../../constants/navigation/Routes';
import { selectEvmChainId } from '../../../../selectors/networkController';


function useHandleSuccessfulOrder() {
  const { selectedChainId, selectedAddress } = useRampSDK();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const dispatchThunk = useThunkDispatch();
  const trackEvent = useAnalytics();
  const accountsByChainId = useSelector(selectAccountsByChainId);
  const chainIdFromProvider = useSelector(selectEvmChainId);

  const addTokenToTokensController = useCallback(
    async (token) => {
      if (!token) return;

      const { address, symbol, decimals, network, name } = token;
      const chainId = network?.chainId;

      if (chainId !== selectedChainId || address === NATIVE_ADDRESS) {
        return;
      }

      const { TokensController } = Engine.context;

      const tokens =
      TokensController.state.allTokens?.[chainId]?.[
      selectedAddress] ||
      [];

      if (
      !tokens.find((stateToken) =>
      toLowerCaseEquals(stateToken.address, address)
      ))
      {
        await TokensController.addToken({
          address,
          symbol,
          decimals,
          name,
          networkClientId: selectedChainId
        });
      }
    },
    [selectedChainId, selectedAddress]
  );

  const handleDispatchUserWalletProtection = useCallback(() => {
    dispatch(protectWalletModalVisible());
  }, [dispatch]);

  const handleSuccessfulOrder = useCallback(
    async (
    order,
    params) =>


    {
      // TODO: Replace "any" with type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await addTokenToTokensController(order?.data?.cryptoCurrency);
      handleDispatchUserWalletProtection();
      // @ts-expect-error navigation prop mismatch
      navigation.dangerouslyGetParent()?.pop();

      dispatchThunk((_dispatch, getState) => {
        const state = getState();
        if (stateHasOrder(state, order)) {
          return;
        }
        _dispatch(addFiatOrder(order));
        const notificationDetails = getNotificationDetails(order);
        if (notificationDetails) {
          NotificationManager.showSimpleNotification(notificationDetails);
        }

        const payload = {
          payment_method_id: order?.data?.paymentMethod?.id,
          order_type: order?.orderType,
          is_apple_pay: Boolean(params?.isApplePay)
        };

        if (order.orderType === OrderOrderTypeEnum.Sell) {
          trackEvent('OFFRAMP_PURCHASE_SUBMITTED', {
            ...payload,
            provider_offramp: order?.data?.provider?.name,
            chain_id_source: selectedChainId,
            currency_source: order?.data?.cryptoCurrency.symbol,
            currency_destination: order?.data?.fiatCurrency.symbol
          });
          navigation.navigate(Routes.TRANSACTIONS_VIEW, {
            screen: Routes.RAMP.ORDER_DETAILS,
            initial: false,
            params: {
              orderId: order.id,
              redirectToSendTransaction: true
            }
          });
        } else {
          trackEvent('ONRAMP_PURCHASE_SUBMITTED', {
            ...payload,
            provider_onramp: order?.data?.provider?.name,
            chain_id_destination: selectedChainId,
            has_zero_currency_destination_balance: false,
            has_zero_native_balance: accountsByChainId[
            toHexadecimal(chainIdFromProvider)][
            selectedAddress]?.balance ?

            hexToBN(
              accountsByChainId[toHexadecimal(chainIdFromProvider)][
              selectedAddress].
              balance
              // TODO: Replace "any" with type
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
            )?.
            isZero?.() :
            undefined,
            currency_source: order?.data?.fiatCurrency.symbol,
            currency_destination: order?.data?.cryptoCurrency.symbol
          });
        }
      });
    },
    [
    chainIdFromProvider,
    accountsByChainId,
    addTokenToTokensController,
    dispatchThunk,
    handleDispatchUserWalletProtection,
    navigation,
    selectedAddress,
    selectedChainId,
    trackEvent]

  );

  return handleSuccessfulOrder;
}

export default useHandleSuccessfulOrder;