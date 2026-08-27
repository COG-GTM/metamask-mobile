import React, { useCallback, useEffect, useState } from 'react';
import { Linking, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { EditGasViewSelectorsIDs } from '../../../../../../../../e2e/selectors/SendFlow/EditGasView.selectors';
import { strings } from '../../../../../../../../locales/i18n';
import AppConstants from '../../../../../../../core/AppConstants';
import { useGasTransaction } from '../../../../../../../core/GasPolling/GasPolling';
import Device from '../../../../../../../util/device';
import { isMainnetByChainId } from '../../../../../../../util/networks';
import {
  mockTheme,
  useAppThemeFromContext,
} from '../../../../../../../util/theme';
import useModalHandler from '../../../../../../Base/hooks/useModalHandler';
import Summary from '../../../../../../Base/Summary';
import Text from '../../../../../../Base/Text';
import FadeAnimationView from '../../../../../../UI/FadeAnimationView';
import InfoModal from '../../../../../../UI/Swaps/components/InfoModal';
import TimeEstimateInfoModal from '../../../../../../UI/TimeEstimateInfoModal';
import SkeletonComponent from './skeletonComponent';
import createStyles from './styles';

const TransactionReviewEIP1559Update = ({
  // @ts-expect-error -- legacy JavaScript UI type boundary
  primaryCurrency,
  // @ts-expect-error -- legacy JavaScript UI type boundary
  chainId,
  // @ts-expect-error -- legacy JavaScript UI type boundary
  onEdit,
  // @ts-expect-error -- legacy JavaScript UI type boundary
  hideTotal,
  // @ts-expect-error -- legacy JavaScript UI type boundary
  noMargin,
  // @ts-expect-error -- legacy JavaScript UI type boundary
  originWarning,
  // @ts-expect-error -- legacy JavaScript UI type boundary
  onUpdatingValuesStart,
  // @ts-expect-error -- legacy JavaScript UI type boundary
  onUpdatingValuesEnd,
  // @ts-expect-error -- legacy JavaScript UI type boundary
  animateOnChange,
  // @ts-expect-error -- legacy JavaScript UI type boundary
  isAnimating,
  // @ts-expect-error -- legacy JavaScript UI type boundary
  gasEstimationReady,
  // @ts-expect-error -- legacy JavaScript UI type boundary
  legacy,
  // @ts-expect-error -- legacy JavaScript UI type boundary
  gasSelected,
  // @ts-expect-error -- legacy JavaScript UI type boundary
  gasObject,
  // @ts-expect-error -- legacy JavaScript UI type boundary
  gasObjectLegacy,
  // @ts-expect-error -- legacy JavaScript UI type boundary
  onlyGas,
  // @ts-expect-error -- legacy JavaScript UI type boundary
  updateTransactionState,
  // @ts-expect-error -- legacy JavaScript UI type boundary
  multiLayerL1FeeTotal,
// @ts-expect-error -- legacy JavaScript UI type boundary
}): Props => {
  const [showLearnMoreModal, setShowLearnMoreModal] = useState(false);
  const [
    isVisibleTimeEstimateInfoModal,
    ,
    // extra comma above is to ignore second value in array returned from hook useModalHandler
    showTimeEstimateInfoModal,
    hideTimeEstimateInfoModal,
  ] = useModalHandler(false);
  const [isVisibleLegacyLearnMore, , showLegacyLearnMore, hideLegacyLearnMore] =
    useModalHandler(false);
  const toggleLearnMoreModal = useCallback(() => {
    setShowLearnMoreModal(!showLearnMoreModal);
  }, [showLearnMoreModal]);
  const { colors } = useAppThemeFromContext() || mockTheme;
  const styles = createStyles(colors);

  const gasTransaction = useGasTransaction({
    onlyGas: !!onlyGas,
    gasSelected,
    legacy: !!legacy,
    gasObject,
    gasObjectLegacy,
    multiLayerL1FeeTotal,
  });

  const {
    gasFeeMaxNative,
    renderableGasFeeMinNative,
    renderableGasFeeMinConversion,
    renderableGasFeeMaxNative,
    renderableTotalMinNative,
    renderableTotalMinConversion,
    renderableTotalMaxNative,
    renderableGasFeeMaxConversion,
    timeEstimateColor,
    timeEstimate,
    timeEstimateId,
    transactionFee,
    transactionFeeFiat,
    transactionTotalAmount,
    transactionTotalAmountFiat,
    suggestedGasLimit,
  } = gasTransaction;

  useEffect(() => {
    if (gasEstimationReady) {
      updateTransactionState(gasTransaction);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    gasEstimationReady,
    updateTransactionState,
    suggestedGasLimit,
    gasFeeMaxNative,
  ]);

  const openLinkAboutGas = useCallback(
    () => Linking.openURL(AppConstants.URLS.WHY_TRANSACTION_TAKE_TIME),
    [],
  );

  const edit = useCallback(() => {
    if (!isAnimating) onEdit();
  }, [isAnimating, onEdit]);

  const isMainnet = isMainnetByChainId(chainId);
  const nativeCurrencySelected = primaryCurrency === 'ETH' || !isMainnet;

  // @ts-expect-error -- legacy JavaScript UI type boundary
  const switchNativeCurrencyDisplayOptions = (nativeValue, fiatValue) => {
    if (nativeCurrencySelected) return nativeValue;
    return fiatValue;
  };

  const valueToWatchAnimation = `${renderableGasFeeMinNative}${renderableGasFeeMaxNative}`;

  return (
    // @ts-expect-error -- legacy JavaScript UI type boundary
    <Summary style={styles.overview(noMargin)}>
      {/* @ts-expect-error -- legacy JavaScript UI type boundary */}
      <Summary.Row>
        {/* @ts-expect-error -- legacy JavaScript UI type boundary */}
        <View style={styles.gasRowContainer}>
          {/* @ts-expect-error -- legacy JavaScript UI type boundary */}
          <View style={styles.gasRowContainer}>
            <Text
              primary={!originWarning}
              bold
              orange={Boolean(originWarning)}
              noMargin
            >
              {strings('transaction_review_eip1559.network_fee')}
              <TouchableOpacity
                // @ts-expect-error -- legacy JavaScript UI type boundary
                style={styles.gasInfoContainer}
                onPress={() =>
                  originWarning ? showLegacyLearnMore() : toggleLearnMoreModal()
                }
                // @ts-expect-error -- legacy JavaScript UI type boundary
                hitSlop={styles.hitSlop}
              >
                <MaterialCommunityIcons
                  name="information"
                  size={13}
                  // @ts-expect-error -- legacy JavaScript UI type boundary
                  style={styles.gasInfoIcon(originWarning)}
                />
              </TouchableOpacity>
            </Text>
          </View>

          {gasEstimationReady ? (
            <FadeAnimationView
              // @ts-expect-error -- legacy JavaScript UI type boundary
              style={styles.valuesContainer}
              valueToWatch={valueToWatchAnimation}
              animateOnChange={animateOnChange}
              onAnimationStart={onUpdatingValuesStart}
              onAnimationEnd={onUpdatingValuesEnd}
            >
              {isMainnet && (
                <TouchableOpacity
                  onPress={edit}
                  disabled={nativeCurrencySelected}
                  testID={EditGasViewSelectorsIDs.ESTIMATED_FEE_TEST_ID}
                >
                  <Text
                    upper
                    right
                    grey={nativeCurrencySelected}
                    link={!nativeCurrencySelected}
                    underline={!nativeCurrencySelected}
                    // @ts-expect-error -- legacy JavaScript UI type boundary
                    style={styles.amountContainer}
                    noMargin
                    adjustsFontSizeToFit
                    numberOfLines={2}
                  >
                    {legacy
                      ? switchNativeCurrencyDisplayOptions(
                          transactionFeeFiat,
                          transactionFee,
                        )
                      : switchNativeCurrencyDisplayOptions(
                          renderableGasFeeMinConversion,
                          renderableGasFeeMinNative,
                        )}
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={edit}
                disabled={!nativeCurrencySelected}
                // @ts-expect-error -- legacy JavaScript UI type boundary
                style={[Device.isSmallDevice() && styles.flex]}
                testID={EditGasViewSelectorsIDs.ESTIMATED_FEE_TEST_ID}
              >
                <Text
                  primary
                  bold
                  upper
                  grey={!nativeCurrencySelected}
                  link={nativeCurrencySelected}
                  underline={nativeCurrencySelected}
                  right
                  noMargin
                  adjustsFontSizeToFit
                  numberOfLines={2}
                >
                  {legacy
                    ? switchNativeCurrencyDisplayOptions(
                        transactionFee,
                        transactionFeeFiat,
                      )
                    : switchNativeCurrencyDisplayOptions(
                        renderableGasFeeMinNative,
                        renderableGasFeeMinConversion,
                      )}
                </Text>
              </TouchableOpacity>
            </FadeAnimationView>
          ) : (
            <SkeletonComponent width={80} />
          )}
        </View>
      </Summary.Row>
      {!legacy && (
        // @ts-expect-error -- legacy JavaScript UI type boundary
        <Summary.Row>
          {/* @ts-expect-error -- legacy JavaScript UI type boundary */}
          <View style={styles.gasRowContainer}>
            {gasEstimationReady ? (
              <FadeAnimationView
                valueToWatch={valueToWatchAnimation}
                animateOnChange={animateOnChange}
              >
                {/* @ts-expect-error -- legacy JavaScript UI type boundary */}
                <View style={styles.timeEstimateContainer}>
                  <Text
                    small
                    green={timeEstimateColor === 'green'}
                    red={timeEstimateColor === 'red'}
                    orange={timeEstimateColor === 'orange'}
                  >
                    {timeEstimate}
                  </Text>
                  {(timeEstimateId === AppConstants.GAS_TIMES.MAYBE ||
                    timeEstimateId === AppConstants.GAS_TIMES.UNKNOWN) && (
                    <TouchableOpacity
                      // @ts-expect-error -- legacy JavaScript UI type boundary
                      style={styles.gasInfoContainer}
                      onPress={showTimeEstimateInfoModal}
                      // @ts-expect-error -- legacy JavaScript UI type boundary
                      hitSlop={styles.hitSlop}
                    >
                      <MaterialCommunityIcons
                        name="information"
                        size={13}
                        // @ts-expect-error -- legacy JavaScript UI type boundary
                        style={styles.redInfo}
                      />
                    </TouchableOpacity>
                  )}
                </View>
              </FadeAnimationView>
            ) : (
              <SkeletonComponent width={120} noStyle />
            )}
            {gasEstimationReady ? (
              <FadeAnimationView
                // @ts-expect-error -- legacy JavaScript UI type boundary
                style={styles.valuesContainer}
                valueToWatch={valueToWatchAnimation}
                animateOnChange={animateOnChange}
              >
                <Text right>
                  <Text
                    bold
                    small
                    noMargin
                    grey={timeEstimateColor !== 'orange'}
                    orange={timeEstimateColor === 'orange'}
                  >
                    {timeEstimateId === AppConstants.GAS_TIMES.VERY_LIKELY && (
                      <TouchableOpacity
                        // @ts-expect-error -- legacy JavaScript UI type boundary
                        style={styles.gasInfoContainer}
                        onPress={showTimeEstimateInfoModal}
                        // @ts-expect-error -- legacy JavaScript UI type boundary
                        hitSlop={styles.hitSlop}
                      >
                        <MaterialCommunityIcons
                          name="alert"
                          size={13}
                          // @ts-expect-error -- legacy JavaScript UI type boundary
                          style={styles.redInfo}
                        />
                      </TouchableOpacity>
                    )}
                  </Text>{' '}
                  <Text
                    bold
                    small
                    noMargin
                    grey={timeEstimateColor !== 'orange'}
                    orange={timeEstimateColor === 'orange'}
                  >
                    {strings('transaction_review_eip1559.max_fee')}:{' '}
                  </Text>
                  <Text
                    small
                    noMargin
                    grey={timeEstimateColor !== 'orange'}
                    orange={timeEstimateColor === 'orange'}
                  >
                    {switchNativeCurrencyDisplayOptions(
                      renderableGasFeeMaxNative,
                      renderableGasFeeMaxConversion,
                    )}
                  </Text>
                </Text>
              </FadeAnimationView>
            ) : (
              <SkeletonComponent width={120} />
            )}
          </View>
        </Summary.Row>
      )}
      {!hideTotal && (
        <View>
          <Summary.Separator />
          {/* @ts-expect-error -- legacy JavaScript UI type boundary */}
          <View style={styles.gasBottomRowContainer}>
            {/* @ts-expect-error -- legacy JavaScript UI type boundary */}
            <Summary.Row>
              <Text primary bold noMargin>
                {strings('transaction_review_eip1559.total')}
              </Text>
              {gasEstimationReady ? (
                <FadeAnimationView
                  // @ts-expect-error -- legacy JavaScript UI type boundary
                  style={styles.valuesContainer}
                  valueToWatch={valueToWatchAnimation}
                  animateOnChange={animateOnChange}
                >
                  {isMainnet &&
                    switchNativeCurrencyDisplayOptions(
                      renderableTotalMinConversion,
                      renderableTotalMinNative,
                    ) !== 'undefined' && (
                      <Text
                        grey
                        upper
                        right
                        noMargin
                        // @ts-expect-error -- legacy JavaScript UI type boundary
                        style={styles.amountContainer}
                        adjustsFontSizeToFit
                        numberOfLines={2}
                      >
                        {legacy
                          ? switchNativeCurrencyDisplayOptions(
                              transactionTotalAmountFiat,
                              transactionTotalAmount,
                            )
                          : switchNativeCurrencyDisplayOptions(
                              renderableTotalMinConversion,
                              renderableTotalMinNative,
                            )}
                      </Text>
                    )}

                  <Text
                    bold
                    primary
                    upper
                    right
                    noMargin
                    // @ts-expect-error -- legacy JavaScript UI type boundary
                    style={[Device.isSmallDevice() && styles.flex]}
                    adjustsFontSizeToFit
                    numberOfLines={2}
                  >
                    {legacy
                      ? switchNativeCurrencyDisplayOptions(
                          transactionTotalAmount,
                          transactionTotalAmountFiat,
                        )
                      : switchNativeCurrencyDisplayOptions(
                          renderableTotalMinNative,
                          renderableTotalMinConversion,
                        )}
                  </Text>
                </FadeAnimationView>
              ) : (
                <SkeletonComponent width={80} />
              )}
            </Summary.Row>
          </View>
          {!legacy && (
            // @ts-expect-error -- legacy JavaScript UI type boundary
            <Summary.Row>
              {gasEstimationReady ? (
                <FadeAnimationView
                  // @ts-expect-error -- legacy JavaScript UI type boundary
                  style={styles.valuesContainer}
                  valueToWatch={valueToWatchAnimation}
                  animateOnChange={animateOnChange}
                >
                  <Text grey right small>
                    <Text bold small noMargin>
                      {strings('transaction_review_eip1559.max_amount')}:
                    </Text>{' '}
                    <Text small noMargin>
                      {switchNativeCurrencyDisplayOptions(
                        renderableTotalMaxNative,
                        renderableGasFeeMaxConversion,
                      )}
                    </Text>
                  </Text>
                </FadeAnimationView>
              ) : (
                <SkeletonComponent width={120} />
              )}
            </Summary.Row>
          )}
        </View>
      )}
      <InfoModal
        isVisible={isVisibleLegacyLearnMore}
        toggleModal={hideLegacyLearnMore}
        body={
          <Text infoModal>
            {strings(
              'transaction_review_eip1559.legacy_gas_suggestion_tooltip',
            )}
          </Text>
        }
      />
      <InfoModal
        isVisible={showLearnMoreModal}
        title={strings('transaction_review_eip1559.estimated_gas_fee_tooltip')}
        toggleModal={toggleLearnMoreModal}
        body={
          <View>
            <Text infoModal>
              {strings(
                'transaction_review_eip1559.estimated_gas_fee_tooltip_text_1',
              )}
              {isMainnet &&
                strings(
                  'transaction_review_eip1559.estimated_gas_fee_tooltip_text_2',
                )}
              {strings(
                'transaction_review_eip1559.estimated_gas_fee_tooltip_text_3',
              )}{' '}
              <Text bold noMargin>
                {strings(
                  'transaction_review_eip1559.estimated_gas_fee_tooltip_text_4',
                )}
              </Text>
            </Text>
            <Text infoModal>
              {strings(
                'transaction_review_eip1559.estimated_gas_fee_tooltip_text_5',
              )}
            </Text>
            <TouchableOpacity onPress={openLinkAboutGas}>
              <Text link>
                {strings('transaction_review_eip1559.learn_more')}
              </Text>
            </TouchableOpacity>
          </View>
        }
      />
      <TimeEstimateInfoModal
        isVisible={isVisibleTimeEstimateInfoModal}
        timeEstimateId={timeEstimateId}
        onHideModal={hideTimeEstimateInfoModal}
      />
    </Summary>
  );
};

export default TransactionReviewEIP1559Update;
