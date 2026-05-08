import React, { useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import IonicIcon from 'react-native-vector-icons/Ionicons';
import { fontStyles } from '../../../../../../../styles/common';
import { strings } from '../../../../../../../../locales/i18n';
import { connect } from 'react-redux';
import Device from '../../../../../../../util/device';
import { useTheme } from '../../../../../../../util/theme';
import ClipboardManager from '../../../../../../../core/ClipboardManager';
import { showAlert } from '../../../../../../../actions/alert';
import GlobalAlert from '../../../../../../UI/GlobalAlert';
import {
  selectConversionRateByChainId,
  selectCurrentCurrency,
} from '../../../../../../../selectors/currencyRateController';
import { Colors } from '../../../../../../../util/theme/models';

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    root: {
      paddingHorizontal: 24,
      paddingTop: 24,
      paddingBottom: Device.isIphoneX() ? 48 : 24,
    },
    dataHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      width: '100%',
      marginBottom: 28,
    },
    dataTitleText: {
      ...fontStyles.bold,
      color: colors.text.default,
      fontSize: 14,
      alignSelf: 'center',
    },
    dataDescription: {
      textAlign: 'center',
      ...fontStyles.normal,
      color: colors.text.default,
      fontSize: 14,
      marginBottom: 28,
    },
    dataBox: {
      padding: 12,
      borderWidth: 1,
      borderColor: colors.border.default,
      borderRadius: 8,
      flex: 1,
    },
    label: {
      flexDirection: 'row',
      justifyContent: 'flex-start',
      marginBottom: 12,
    },
    boldLabel: {
      ...fontStyles.bold,
    },
    labelText: {
      ...fontStyles.normal,
      color: colors.text.default,
      fontSize: 14,
    },
    hexData: {
      ...fontStyles.normal,
      backgroundColor: colors.background.default,
      color: colors.text.default,
      fontSize: 14,
      paddingTop: 0,
    },
    scrollView: {
      flex: 1,
    },
  });

interface OwnProps {
  /**
   * Transaction corresponding action key
   */
  actionKey?: string;
  /**
   * Hides or shows transaction data
   */
  toggleDataView?: () => void;
  /**
   * Height of custom gas and data modal
   */
  customGasHeight?: number;
}

interface StateProps {
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  conversionRate: any;
  currentCurrency: string;
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transaction: any;
}

interface DispatchProps {
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  showAlert: (config: any) => void;
}

type TransactionReviewDataProps = OwnProps & StateProps & DispatchProps;

/**
 * Functional component that supports reviewing transaction data
 */
const TransactionReviewData = ({
  transaction,
  actionKey,
  toggleDataView,
  customGasHeight,
  showAlert: showAlertAction,
}: TransactionReviewDataProps) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const applyRootHeight = () => ({ height: customGasHeight });

  const handleCopyHex = useCallback(() => {
    const data = transaction?.transaction?.data;
    ClipboardManager.setString(data);
    showAlertAction({
      isVisible: true,
      autodismiss: 1500,
      content: 'clipboard-alert',
      data: { msg: strings('transaction.hex_data_copied') },
    });
  }, [transaction, showAlertAction]);

  const data = transaction?.transaction?.data;

  return (
    <View style={[styles.root, applyRootHeight()]}>
      <View style={styles.dataHeader}>
        <TouchableOpacity onPress={toggleDataView}>
          <IonicIcon
            name={'arrow-back'}
            size={24}
            color={colors.text.default}
          />
        </TouchableOpacity>
        <Text style={styles.dataTitleText}>
          {strings('transaction.data')}
        </Text>
        <IonicIcon
          name={'arrow-back'}
          size={24}
          color={colors.background.default}
        />
      </View>
      <Text style={styles.dataDescription}>
        {strings('transaction.data_description')}
      </Text>
      <View style={styles.dataBox}>
        {actionKey !== strings('transactions.tx_review_confirm') && (
          <View style={styles.label}>
            <Text style={[styles.labelText, styles.boldLabel]}>
              {strings('transaction.review_function')}:{' '}
            </Text>
            <Text style={styles.labelText}>{actionKey}</Text>
          </View>
        )}
        <Text style={[styles.labelText, styles.boldLabel]}>
          {strings('transaction.review_hex_data')}:{' '}
        </Text>
        <View style={styles.scrollView}>
          <KeyboardAwareScrollView style={styles.scrollView}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleCopyHex}
              style={styles.scrollView}
            >
              <Text style={styles.hexData}>{data}</Text>
            </TouchableOpacity>
          </KeyboardAwareScrollView>
        </View>
      </View>
      <GlobalAlert />
    </View>
  );
};

// TODO: Replace "any" with type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapStateToProps = (state: any): StateProps => ({
  conversionRate: selectConversionRateByChainId(state, state.transaction.chainId),
  currentCurrency: selectCurrentCurrency(state),
  transaction: state.transaction,
});

// TODO: Replace "any" with type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapDispatchToProps = (dispatch: any): DispatchProps => ({
  showAlert: (config) => dispatch(showAlert(config)),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(TransactionReviewData);
