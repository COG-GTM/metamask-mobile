/* eslint-disable @typescript-eslint/no-shadow */
import React from 'react';
import { StyleSheet, View, Text, InteractionManager } from 'react-native';
import URL from 'url-parse';
import { useSelector } from 'react-redux';
import { fontStyles } from '../../../../../../styles/common';
import { strings } from '../../../../../../../locales/i18n';
import ActionView from '../../../../../UI/ActionView';
import { renderFromTokenMinimalUnit } from '../../../../../../util/number';
import TokenImage from '../../../../../UI/TokenImage';
import Device from '../../../../../../util/device';
import { MetaMetricsEvents } from '../../../../../../core/Analytics';

import useTokenBalance from '../../../../../hooks/useTokenBalance';
import { useTheme } from '../../../../../../util/theme';
import NotificationManager from '../../../../../../core/NotificationManager';
import { selectEvmChainId } from '../../../../../../selectors/networkController';
import ApproveTransactionHeader from '../ApproveTransactionHeader';
import { getActiveTabUrl } from '../../../../../../util/transactions';
import { isEqual } from 'lodash';
import { AssetWatcherSelectorsIDs } from '../../../../../../../e2e/selectors/Transactions/AssetWatcher.selectors';
import { getDecimalChainId } from '../../../../../../util/networks';
import { useMetrics } from '../../../../../../components/hooks/useMetrics';
import Logger from '../../../../../../util/Logger';
import type BN from 'bnjs4';

// TODO: Replace "any" with type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createStyles = (colors: any) =>
  StyleSheet.create({
    root: {
      backgroundColor: colors.background.default,
      borderTopLeftRadius: 10,
      borderTopRightRadius: 10,
      paddingBottom: Device.isIphoneX() ? 20 : 0,
      minHeight: Device.isIos() ? '55%' : '65%',
    },
    title: {
      textAlign: 'center',
      fontSize: 18,
      marginVertical: 12,
      marginHorizontal: 20,
      color: colors.text.default,
      ...fontStyles.bold,
    },
    text: {
      ...fontStyles.normal,
      fontSize: 16,
      paddingTop: 25,
      paddingHorizontal: 10,
      color: colors.text.default,
    },
    tokenInformation: {
      flexDirection: 'row',
      marginHorizontal: 40,
      flex: 1,
      alignItems: 'flex-start',
      marginVertical: 30,
    },
    tokenInfo: {
      flex: 1,
      flexDirection: 'column',
    },
    approveTransactionHeaderWrapper: {
      paddingTop: 16,
    },
    infoTitleWrapper: {
      alignItems: 'center',
    },
    infoTitle: {
      ...fontStyles.bold,
      color: colors.text.default,
    },
    infoBalance: {
      alignItems: 'center',
    },
    infoToken: {
      alignItems: 'center',
    },
    token: {
      flexDirection: 'row',
    },
    identicon: {
      paddingVertical: 10,
    },
    signText: {
      ...fontStyles.normal,
      fontSize: 16,
      color: colors.text.default,
    },
    addMessage: {
      flexDirection: 'row',
      margin: 20,
    },
    children: {
      alignItems: 'center',
      borderTopColor: colors.border.muted,
      borderTopWidth: 1,
    },
  });

interface WatchAssetRequestProps {
  onCancel?: () => void;
  onConfirm?: () => Promise<void> | void;
  // TODO: Replace "any" with type
  /* eslint-disable @typescript-eslint/no-explicit-any */
  suggestedAssetMeta: any;
  currentPageInformation?: any;
  /* eslint-enable @typescript-eslint/no-explicit-any */
}

const WatchAssetRequest = ({
  suggestedAssetMeta,
  currentPageInformation,
  onCancel,
  onConfirm,
}: WatchAssetRequestProps) => {
  const { asset, interactingAddress } = suggestedAssetMeta;
  // TODO - Once TokensController is updated, interactingAddress should always be defined
  const { colors } = useTheme();
  const { trackEvent, createEventBuilder } = useMetrics();
  const styles = createStyles(colors);
  const [balance, , error] = useTokenBalance(asset.address, interactingAddress);
  const chainId = useSelector(selectEvmChainId);
  const balanceWithSymbol = error
    ? strings('transaction.failed')
    : `${renderFromTokenMinimalUnit(
        balance as BN,
        asset.decimals,
      )} ${asset.symbol}`;

  const activeTabUrl = useSelector(getActiveTabUrl, isEqual);

  const getTokenAddedAnalyticsParams = () => {
    try {
      const url = new URL(currentPageInformation?.url);

      return {
        token_address: asset?.address,
        token_symbol: asset?.symbol,
        dapp_host_name: url?.host,
        chain_id: getDecimalChainId(chainId),
        source: 'Dapp suggested (watchAsset)',
      };
    } catch (error) {
      Logger.error(
        error as Error,
        'WatchAssetRequest.getTokenAddedAnalyticsParams',
      );
      return undefined;
    }
  };

  const onConfirmPress = async () => {
    await onConfirm?.();
    InteractionManager.runAfterInteractions(() => {
      const analyticsParams = getTokenAddedAnalyticsParams();

      if (analyticsParams) {
        trackEvent(
          createEventBuilder(MetaMetricsEvents.TOKEN_ADDED)
            .addProperties(analyticsParams)
            .build(),
        );
      }

      NotificationManager.showSimpleNotification({
        status: `simple_notification`,
        duration: 5000,
        title: strings('wallet.token_toast.token_imported_title'),
        description: strings('wallet.token_toast.token_imported_desc', {
          tokenSymbol: asset?.symbol || '---',
        }),
      });
    });
  };

  const { address, symbol, decimals, standard } = asset;

  return (
    <View style={styles.root} testID={AssetWatcherSelectorsIDs.CONTAINER}>
      <View style={styles.approveTransactionHeaderWrapper}>
        <ApproveTransactionHeader
          origin={currentPageInformation?.url}
          url={activeTabUrl}
          from={suggestedAssetMeta.interactingAddress}
          asset={{
            address,
            symbol,
            decimals,
            standard,
          }}
          dontWatchAsset
        />
      </View>
      <View
        // styles.titleWrapper is undefined at runtime in the original JS;
        // preserved as-is during type-only migration.
        // TODO: Replace "any" with type
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        style={(styles as any).titleWrapper}
      >
        <Text
          style={styles.title}
          onPress={
            (this as unknown as { cancelSignature?: () => void })
              ?.cancelSignature
          }
        >
          {strings('watch_asset_request.title')}
        </Text>
      </View>
      <ActionView
        cancelTestID={AssetWatcherSelectorsIDs.CANCEL_BUTTON}
        confirmTestID={AssetWatcherSelectorsIDs.CONFIRM_BUTTON}
        cancelText={strings('watch_asset_request.cancel')}
        confirmText={strings('watch_asset_request.add')}
        onCancelPress={onCancel}
        onConfirmPress={onConfirmPress}
      >
        <View style={styles.children}>
          <View style={styles.addMessage}>
            <Text style={styles.signText}>
              {strings('watch_asset_request.message')}
            </Text>
          </View>

          <View style={styles.tokenInformation}>
            <View style={styles.tokenInfo}>
              <View style={styles.infoTitleWrapper}>
                <Text style={styles.infoTitle}>
                  {strings('watch_asset_request.token')}
                </Text>
              </View>

              <View style={styles.infoToken}>
                <View style={styles.token}>
                  <View style={styles.identicon}>
                    <TokenImage asset={asset} />
                  </View>
                  <Text style={styles.text}>{asset.symbol}</Text>
                </View>
              </View>
            </View>

            <View style={styles.tokenInfo}>
              <View style={styles.infoTitleWrapper}>
                <Text style={styles.infoTitle}>
                  {strings('watch_asset_request.balance')}
                </Text>
              </View>

              <View style={styles.infoBalance}>
                <Text style={styles.text}>{balanceWithSymbol}</Text>
              </View>
            </View>
          </View>
        </View>
      </ActionView>
    </View>
  );
};

export default WatchAssetRequest;
