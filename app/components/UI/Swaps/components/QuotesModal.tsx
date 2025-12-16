import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  LayoutAnimation,
  UIManager,
  Platform,
  SafeAreaView,
  ViewStyle,
  TextStyle,
} from 'react-native';
import Modal from 'react-native-modal';
import IonicIcon from 'react-native-vector-icons/Ionicons';
import { connect } from 'react-redux';
import BigNumber from 'bignumber.js';
import { strings } from '../../../../../locales/i18n';
import {
  fromTokenMinimalUnitString,
  renderFromTokenMinimalUnit,
  renderFromWei,
  toWei,
  weiToFiat,
  calculateEthFeeForMultiLayer,
} from '../../../../util/number';
import { getQuotesSourceMessage } from '../utils';
import Text from '../../../Base/Text';
import Title from '../../../Base/Title';
import Ratio from './Ratio';
import { useTheme } from '../../../../util/theme';
import {
  selectConversionRate,
  selectCurrentCurrency,
} from '../../../../selectors/currencyRateController';
import { selectSwapsQuoteValues } from '../../../../reducers/swaps';
import { RootState } from '../../../../reducers';
import { Theme } from '../../../../util/theme/models';

interface Styles {
  modalView: ViewStyle;
  modal: ViewStyle;
  title: ViewStyle;
  titleButton: ViewStyle;
  closeIcon: TextStyle;
  backIcon: TextStyle;
  detailsIcon: TextStyle;
  body: ViewStyle;
  row: ViewStyle;
  quoteRow: ViewStyle;
  detailsRow: ViewStyle;
  selectedQuoteRow: ViewStyle;
  columnAmount: ViewStyle;
  columnFee: ViewStyle;
  columnValue: ViewStyle;
  red: TextStyle;
  transparent: ViewStyle;
}

const createStyles = (colors: Theme['colors'], shadows: Theme['shadows']): Styles =>
  StyleSheet.create({
    modalView: {
      backgroundColor: colors.background.default,
      justifyContent: 'center',
      alignItems: 'center',
      marginVertical: 50,
      borderRadius: 10,
      ...shadows.size.sm,
      elevation: 11,
    },
    modal: {
      margin: 0,
      width: '100%',
      padding: 25,
    },
    title: {
      width: '100%',
      paddingVertical: 15,
      paddingHorizontal: 20,
      paddingBottom: 5,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    titleButton: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
    },
    closeIcon: {
      color: colors.text.default,
    },
    backIcon: {
      color: colors.text.default,
      marginRight: 16,
    },
    detailsIcon: {
      color: colors.text.default,
      paddingHorizontal: 10,
    },
    body: {
      width: '100%',
      paddingVertical: 5,
    },
    row: {
      paddingHorizontal: 20,
      flexDirection: 'row',
      paddingVertical: 10,
    },
    quoteRow: {
      borderTopWidth: 1,
      borderTopColor: colors.border.muted,
      paddingVertical: 15,
      alignItems: 'center',
    },
    detailsRow: {
      paddingHorizontal: 20,
      borderTopWidth: 1,
      borderTopColor: colors.border.muted,
      paddingVertical: 15,
    },
    selectedQuoteRow: {
      backgroundColor: colors.primary.muted,
    },
    columnAmount: {
      flex: 3,
      marginRight: 5,
    },
    columnFee: {
      flex: 3,
      marginRight: 5,
    },
    columnValue: {
      flex: 3,
      marginRight: 5,
    },
    red: {
      color: colors.error.default,
    },
    transparent: {
      opacity: 0,
    },
  });

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface Token {
  symbol?: string;
  decimals?: number;
}

interface PriceSlippage {
  calculationError?: string;
  destinationAmountInETH?: string;
}

interface Quote {
  aggregator: string;
  sourceAmount?: string;
  destinationAmount?: string;
  slippage?: number;
  aggType?: string;
  priceSlippage?: PriceSlippage;
}

interface QuoteValue {
  overallValueOfQuote?: number;
  ethFee?: string;
}

interface QuotesModalProps {
  isVisible?: boolean;
  toggleModal?: () => void;
  quotes?: Quote[];
  selectedQuote?: string;
  sourceToken?: Token;
  destinationToken?: Token;
  conversionRate?: number;
  currentCurrency?: string;
  quoteValues?: Record<string, QuoteValue>;
  showOverallValue?: boolean;
  ticker?: string;
  multiLayerL1ApprovalFeeTotal?: string;
}

function QuotesModal({
  isVisible,
  toggleModal,
  quotes = [],
  selectedQuote,
  sourceToken,
  destinationToken,
  conversionRate,
  currentCurrency,
  quoteValues = {},
  showOverallValue,
  ticker,
  multiLayerL1ApprovalFeeTotal,
}: QuotesModalProps): React.JSX.Element {
  const bestOverallValue =
    quoteValues?.[quotes[0]?.aggregator]?.overallValueOfQuote ?? 0;
  const [displayDetails, setDisplayDetails] = useState(false);
  const [selectedDetailsQuoteIndex, setSelectedDetailsQuoteIndex] =
    useState<number | null>(null);
  const { colors, shadows } = useTheme();
  const styles = createStyles(colors, shadows);

  const selectedDetailsQuote = useMemo(() => {
    if (
      selectedDetailsQuoteIndex !== null &&
      quotes?.[selectedDetailsQuoteIndex]
    ) {
      return quotes[selectedDetailsQuoteIndex];
    }
    return null;
  }, [quotes, selectedDetailsQuoteIndex]);

  const selectedDetailsQuoteValues = useMemo(() => {
    if (
      selectedDetailsQuoteIndex !== null &&
      selectedDetailsQuote &&
      quoteValues?.[selectedDetailsQuote.aggregator]
    ) {
      return quoteValues[selectedDetailsQuote.aggregator];
    }
    return null;
  }, [quoteValues, selectedDetailsQuote, selectedDetailsQuoteIndex]);

  const toggleDetails = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setDisplayDetails((f) => !f);
  }, []);

  const handleQuoteDetailsPress = useCallback(
    (index: number) => {
      if (quotes?.[index]) {
        setSelectedDetailsQuoteIndex(index);
        toggleDetails();
      }
    },
    [toggleDetails, quotes],
  );

  const handleBackButtonPress = useCallback(() => {
    if (displayDetails) {
      return toggleDetails();
    }
    toggleModal?.();
  }, [toggleDetails, displayDetails, toggleModal]);

  useEffect(() => {
    if (isVisible) {
      setDisplayDetails(false);
    }
  }, [isVisible]);

  useEffect(() => {
    setSelectedDetailsQuoteIndex(quotes?.[0] ? 0 : null);
  }, [quotes]);

  useEffect(() => {
    if (displayDetails && !selectedDetailsQuote) {
      setDisplayDetails(false);
    }
  }, [displayDetails, selectedDetailsQuote]);

  let selectedDetailsQuoteValuesEthFee = selectedDetailsQuoteValues?.ethFee;
  if (multiLayerL1ApprovalFeeTotal) {
    selectedDetailsQuoteValuesEthFee = calculateEthFeeForMultiLayer({
      multiLayerL1FeeTotal: multiLayerL1ApprovalFeeTotal,
      ethFee: selectedDetailsQuoteValuesEthFee,
    });
  }

  return (
    <Modal
      isVisible={isVisible}
      onBackdropPress={toggleModal}
      onBackButtonPress={handleBackButtonPress}
      onSwipeComplete={toggleModal}
      swipeDirection="down"
      propagateSwipe
      style={styles.modal}
      backdropColor={colors.overlay.default}
      backdropOpacity={1}
    >
      <SafeAreaView style={styles.modalView}>
        <View style={styles.title}>
          {displayDetails ? (
            <TouchableOpacity
              onPress={toggleDetails}
              style={styles.titleButton}
              hitSlop={{ top: 10, left: 20, right: 10, bottom: 10 }}
            >
              <IonicIcon
                name="arrow-back"
                style={styles.backIcon}
                size={20}
              />
              <Title>{strings('swaps.quote_details')}</Title>
            </TouchableOpacity>
          ) : (
            <Title>{strings('swaps.quotes_overview')}</Title>
          )}

          <TouchableOpacity
            onPress={toggleModal}
            hitSlop={{ top: 20, left: 20, right: 20, bottom: 20 }}
          >
            <IonicIcon name="close" style={styles.closeIcon} size={30} />
          </TouchableOpacity>
        </View>
        {displayDetails ? (
          <ScrollView key="details" style={styles.body}>
            <View onStartShouldSetResponder={() => true}>
              {!!selectedDetailsQuote && !!selectedDetailsQuoteValues && (
                <>
                  <View style={styles.detailsRow}>
                    <Text small>{strings('swaps.rate')}</Text>
                    <Ratio
                      sourceAmount={selectedDetailsQuote.sourceAmount}
                      sourceToken={sourceToken}
                      destinationAmount={selectedDetailsQuote.destinationAmount}
                      destinationToken={destinationToken}
                      boldSymbol
                    />
                  </View>
                  <View style={styles.detailsRow}>
                    <Text small>
                      {strings('swaps.quote_details_max_slippage')}
                    </Text>
                    <Text primary>{selectedDetailsQuote.slippage}%</Text>
                  </View>
                  <View style={styles.detailsRow}>
                    <Text small>{strings('swaps.guaranteed_amount')}</Text>
                    <Text primary>
                      {fromTokenMinimalUnitString(
                        selectedDetailsQuote.destinationAmount ?? '0',
                        destinationToken?.decimals ?? 18,
                      )}{' '}
                      <Text reset bold>
                        {destinationToken?.symbol}
                      </Text>
                      {selectedDetailsQuote?.priceSlippage?.calculationError
                        ?.length === 0 &&
                        selectedDetailsQuote?.priceSlippage
                          ?.destinationAmountInETH && (
                          <Text>
                            {' '}
                            (~
                            {weiToFiat(
                              toWei(
                                selectedDetailsQuote.priceSlippage
                                  .destinationAmountInETH,
                              ),
                              conversionRate ?? 0,
                              currentCurrency ?? 'usd',
                            )}
                            )
                          </Text>
                        )}
                    </Text>
                  </View>
                  <View style={styles.detailsRow}>
                    <Text small>{strings('swaps.estimated_network_fees')}</Text>
                    <Text primary>
                      {renderFromWei(toWei(selectedDetailsQuoteValuesEthFee ?? '0'))}{' '}
                      <Text reset bold>
                        {ticker}
                      </Text>{' '}
                      <Text>
                        (~
                        {weiToFiat(
                          toWei(selectedDetailsQuoteValuesEthFee ?? '0'),
                          conversionRate ?? 0,
                          currentCurrency ?? 'usd',
                        )}
                        )
                      </Text>
                    </Text>
                  </View>
                  <View style={styles.detailsRow}>
                    <Text small>{strings('swaps.source')}</Text>
                    <Text primary>
                      {getQuotesSourceMessage(selectedDetailsQuote.aggType ?? '').map(
                        (message: string, index: number) =>
                          index === 1 ? (
                            <Text reset bold key={index}>
                              {message}{' '}
                            </Text>
                          ) : (
                            <Text reset key={index}>
                              {message}{' '}
                            </Text>
                          ),
                      )}
                    </Text>
                  </View>
                </>
              )}
            </View>
          </ScrollView>
        ) : (
          <ScrollView key="list" style={styles.body}>
            <View onStartShouldSetResponder={() => true}>
              <View style={styles.body}>
                <View style={styles.row}>
                  <View style={styles.columnAmount}>
                    <Text small bold>
                      {destinationToken?.symbol}
                    </Text>
                    <Text small primary bold>
                      {strings('swaps.receiving')}
                    </Text>
                  </View>
                  <View style={styles.columnFee}>
                    <Text small primary bold>
                      {strings('swaps.estimated_gas_fee')}
                    </Text>
                  </View>
                  <View style={styles.columnValue}>
                    <Text small primary bold>
                      {strings('swaps.overall_value')}
                    </Text>
                  </View>
                  <IonicIcon
                    name="arrow-forward"
                    style={[styles.detailsIcon, styles.transparent]}
                    size={20}
                  />
                </View>
                <View>
                  {quotes.length > 0 &&
                    quotes.map((quote, index) => {
                      const { aggregator } = quote;
                      const isSelected = aggregator === selectedQuote;
                      const quoteValue = quoteValues[aggregator];
                      let quoteEthFee = quoteValue?.ethFee;
                      if (multiLayerL1ApprovalFeeTotal) {
                        quoteEthFee = calculateEthFeeForMultiLayer({
                          multiLayerL1FeeTotal: multiLayerL1ApprovalFeeTotal,
                          ethFee: quoteEthFee,
                        });
                      }
                      return (
                        <TouchableOpacity
                          key={aggregator}
                          onPress={() => handleQuoteDetailsPress(index)}
                          style={[
                            styles.row,
                            styles.quoteRow,
                            isSelected && styles.selectedQuoteRow,
                          ]}
                        >
                          <View style={styles.columnAmount}>
                            <Text primary bold={isSelected}>
                              ~
                              {renderFromTokenMinimalUnit(
                                quote.destinationAmount ?? '0',
                                destinationToken?.decimals ?? 18,
                              )}
                            </Text>
                          </View>
                          <View style={styles.columnFee}>
                            <Text primary bold={isSelected}>
                              {weiToFiat(
                                toWei(quoteEthFee ?? '0'),
                                conversionRate ?? 0,
                                currentCurrency ?? 'usd',
                              )}
                            </Text>
                          </View>
                          <View style={styles.columnValue}>
                            {showOverallValue ? (
                              <Text primary style={styles.red}>
                                -
                                {weiToFiat(
                                  toWei(
                                    (
                                      bestOverallValue -
                                      (quoteValue?.overallValueOfQuote ?? 0)
                                    ).toFixed(18),
                                  ),
                                  conversionRate ?? 0,
                                  currentCurrency ?? 'usd',
                                )}
                              </Text>
                            ) : (
                              <Text style={styles.red}>
                                -
                                {renderFromTokenMinimalUnit(
                                  new BigNumber(quotes[0]?.destinationAmount ?? '0')
                                    .minus(quote.destinationAmount ?? '0')
                                    .toString(10),
                                  destinationToken?.decimals ?? 18,
                                )}
                              </Text>
                            )}
                          </View>
                          <IonicIcon
                            name="arrow-forward"
                            style={styles.detailsIcon}
                            size={20}
                          />

                          <Text />
                        </TouchableOpacity>
                      );
                    })}
                </View>
              </View>
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const mapStateToProps = (state: RootState) => ({
  conversionRate: selectConversionRate(state),
  currentCurrency: selectCurrentCurrency(state),
  quoteValues: selectSwapsQuoteValues(state),
});

export default connect(mapStateToProps)(QuotesModal);
