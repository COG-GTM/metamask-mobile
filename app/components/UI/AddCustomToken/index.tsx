import React, { useEffect, useRef, useState } from 'react';
import {
  Text,
  TextInput,
  View,
  StyleSheet,
  InteractionManager,
  ScrollView,
  TouchableOpacity,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { ParamListBase } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { fontStyles } from '../../../styles/common';
import Engine from '../../../core/Engine';
import { strings } from '../../../../locales/i18n';
import { isValidAddress } from 'ethereumjs-util';
import { isSmartContractAddress } from '../../../util/transactions';
import { MetaMetricsEvents } from '../../../core/Analytics';

import AppConstants from '../../../core/AppConstants';
import Alert, { AlertType } from '../../Base/Alert';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import NotificationManager from '../../../core/NotificationManager';
import { useTheme } from '../../../util/theme';
import { Colors } from '../../../util/theme/models';
import { ImportTokenViewSelectorsIDs } from '../../../../e2e/selectors/wallet/ImportTokenView.selectors';
import { regex } from '../../../../app/util/regex';
import {
  getBlockExplorerAddressUrl,
  getDecimalChainId,
  getNetworkImageSource,
} from '../../../util/networks';
import { withMetricsAwareness } from '../../../components/hooks/useMetrics';
import { IWithMetricsAwarenessProps } from '../../../components/hooks/useMetrics/withMetricsAwareness.types';
import { formatIconUrlWithProxy } from '@metamask/assets-controllers';
import Button, {
  ButtonSize,
  ButtonVariants,
} from '../../../component-library/components/Buttons/Button';
import Icon, {
  IconColor,
  IconName,
  IconSize,
} from '../../../component-library/components/Icons/Icon';
import Banner, {
  BannerAlertSeverity,
  BannerVariant,
} from '../../../component-library/components/Banners/Banner';
import CLText from '../../../component-library/components/Texts/Text/Text';
import Logger from '../../../util/Logger';
import Avatar, {
  AvatarSize,
  AvatarVariant,
} from '../../../component-library/components/Avatars/Avatar';
import ButtonIcon from '../../../component-library/components/Buttons/ButtonIcon';
import { endTrace, trace, TraceName } from '../../../util/trace';

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    wrapper: {
      backgroundColor: colors.background.default,
      flex: 1,
    },
    overlappingAvatarsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      position: 'absolute',
      paddingHorizontal: 16,
      right: 0,
    },
    addressWrapper: {
      paddingHorizontal: 16,
      paddingTop: 16,
    },
    rowWrapper: {
      paddingHorizontal: 16,
    },
    buttonWrapper: {
      paddingVertical: 20,
    },
    textInput: {
      borderWidth: 1,
      borderRadius: 8,
      borderColor: colors.border.default,
      paddingHorizontal: 16,
      paddingVertical: 12,
      ...fontStyles.normal,
      color: colors.text.default,
    },
    link: {
      color: colors.info.default,
    },
    textInputError: {
      borderColor: colors.error.default,
      borderRadius: 8,
      borderWidth: 2,
      paddingHorizontal: 16,
      paddingVertical: 12,
      ...fontStyles.normal,
    },
    textInputDisabled: {
      color: colors.text.muted,
      fontWeight: 'bold',
    },
    textInputFocus: {
      borderColor: colors.primary.default,
      borderWidth: 2,
    },
    inputLabel: {
      ...fontStyles.normal,
      color: colors.text.default,
    },
    warningText: {
      ...fontStyles.normal,
      marginTop: 0,
      color: colors.error.default,
      paddingBottom: 8,
    },
    tokenDetectionBanner: { marginHorizontal: 20, marginTop: 20 },
    tokenDetectionDescription: { color: colors.text.default },
    tokenDetectionLink: { color: colors.primary.default },
    tokenDetectionIcon: {
      paddingTop: 4,
      paddingRight: 8,
    },
    import: {
      fontSize: 18,
      color: colors.primary.default,
      ...fontStyles.normal,
      position: 'relative',
      width: '90%',
      alignSelf: 'center',
    },
    textWrapper: {
      padding: 0,
    },
    networkSelectorContainer: {
      borderWidth: 1,
      marginBottom: 16,
      marginTop: 4,
      borderColor: colors.border.default,
      borderRadius: 2,
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
    },
    networkSelectorText: {
      ...fontStyles.normal,
      color: colors.text.default,
      fontSize: 16,
    },
  });

interface Props extends IWithMetricsAwarenessProps {
  /**
   * The chain ID for the current selected network
   */
  chainId?: string;
  /**
   * The network name
   */
  networkName?: string;
  /**
   * The network ticker
   */
  ticker?: string;
  /**
   * The network type
   */
  type?: string;
  /**
   * navigation object required to push new views
   */
  navigation?: StackNavigationProp<ParamListBase>;
  /**
   * Checks if token detection is supported
   */
  isTokenDetectionSupported?: boolean;
  /**
   * Function to set the open network selector
   */
  setOpenNetworkSelector?: (isOpen: boolean) => void;
  /**
   * The selected network
   */
  selectedNetwork?: string;
  /**
   * The network client ID
   */
  networkClientId?: string;
}

/**
 * Copmonent that provides ability to add custom tokens.
 */
const AddCustomToken = ({
  chainId,
  networkName,
  ticker,
  type,
  navigation,
  isTokenDetectionSupported,
  metrics,
  setOpenNetworkSelector,
  selectedNetwork,
  networkClientId,
}: Props) => {
  const [address, setAddress] = useState('');
  const [symbol, setSymbol] = useState('');
  const [decimals, setDecimals] = useState('');
  const [name, setName] = useState('');
  const [warningAddress, setWarningAddress] = useState('');
  const [warningSymbol, setWarningSymbol] = useState('');
  const [warningDecimals, setWarningDecimals] = useState('');
  const [isSymbolEditable, setIsSymbolEditable] = useState(true);
  const [isDecimalEditable, setIsDecimalEditable] = useState(true);
  const [onFocusAddress, setOnFocusAddress] = useState(false);

  const assetSymbolInput = useRef<TextInput>(null);
  const assetPrecisionInput = useRef<TextInput>(null);

  const { colors, themeAppearance } = useTheme();
  const styles = createStyles(colors);

  const prevNetworkClientId = useRef(networkClientId);
  useEffect(() => {
    if (prevNetworkClientId.current !== networkClientId) {
      prevNetworkClientId.current = networkClientId;
      setAddress('');
      setSymbol('');
      setDecimals('');
      setName('');
      setWarningAddress('');
    }
  }, [networkClientId]);

  const getTokenAddedAnalyticsParams = () => {
    try {
      return {
        token_address: address,
        token_symbol: symbol,
        chain_id: getDecimalChainId(chainId),
        source: 'Custom token',
      };
    } catch (error) {
      Logger.error(
        error as Error,
        'AddCustomToken.getTokenAddedAnalyticsParams error',
      );
      return undefined;
    }
  };

  const validateCustomTokenAddress = async (tokenAddress: string) => {
    let validated = true;
    const isValidTokenAddress = isValidAddress(tokenAddress);

    const toSmartContract =
      isValidTokenAddress &&
      (await isSmartContractAddress(tokenAddress, chainId as string));

    const addressWithoutSpaces = tokenAddress.replace(
      regex.addressWithSpaces,
      '',
    );

    if (addressWithoutSpaces.length === 0) {
      setWarningAddress(strings('token.address_cant_be_empty'));
      validated = false;
    } else if (!isValidTokenAddress) {
      setWarningAddress(strings('token.address_must_be_valid'));
      validated = false;
    } else if (!toSmartContract) {
      setWarningAddress(strings('token.address_must_be_smart_contract'));
      validated = false;
    } else {
      setWarningAddress(``);
    }
    return validated;
  };

  const validateCustomTokenSymbol = () => {
    let validated = true;
    const symbolWithoutSpaces = symbol.replace(regex.addressWithSpaces, '');
    if (symbolWithoutSpaces.length === 0) {
      setWarningSymbol(strings('token.symbol_cant_be_empty'));
      validated = false;
    } else if (symbol.length >= 11) {
      setWarningSymbol(strings('token.symbol_length'));
    } else {
      setWarningSymbol(``);
    }
    return validated;
  };

  const validateCustomTokenDecimals = () => {
    let validated = true;
    const decimalsWithoutSpaces = decimals.replace(
      regex.addressWithSpaces,
      '',
    );
    if (decimalsWithoutSpaces.length === 0) {
      setWarningDecimals(strings('token.decimals_is_required'));
      validated = false;
    } else {
      setWarningDecimals(``);
    }
    return validated;
  };

  const validateCustomToken = async () => {
    const validatedAddress = await validateCustomTokenAddress(address);
    const validatedSymbol = validateCustomTokenSymbol();
    const validatedDecimals = validateCustomTokenDecimals();
    return validatedAddress && validatedSymbol && validatedDecimals;
  };

  const addToken = async () => {
    if (!(await validateCustomToken())) return;
    const { TokensController } = Engine.context;

    trace({ name: TraceName.ImportTokens });
    await TokensController.addToken({
      address,
      symbol,
      decimals: Number(decimals),
      name,
      // @ts-expect-error - chainId is not part of the typed addToken params but is passed through at runtime
      chainId: chainId as `0x${string}`,
      networkClientId: networkClientId as string,
    });
    endTrace({ name: TraceName.ImportTokens });

    const analyticsParams = getTokenAddedAnalyticsParams();

    if (analyticsParams) {
      metrics.trackEvent(
        metrics
          .createEventBuilder(MetaMetricsEvents.TOKEN_ADDED)
          .addProperties(analyticsParams)
          .build(),
      );
    }

    // Clear state before closing
    setAddress('');
    setSymbol('');
    setDecimals('');
    setWarningAddress('');
    setWarningSymbol('');
    setWarningDecimals('');
    InteractionManager.runAfterInteractions(() => {
      navigation?.goBack();
      navigation?.goBack();
      NotificationManager.showSimpleNotification({
        status: `import_success`,
        duration: 5000,
        title: strings('wallet.token_toast.token_imported_title'),
        description: strings('wallet.token_toast.token_imported_desc_1'),
      });
    });
  };

  const onAddressChange = async (newAddress: string) => {
    setAddress(newAddress);
    if (newAddress.length === 42) {
      try {
        setIsSymbolEditable(false);
        setIsDecimalEditable(false);

        const validated = await validateCustomTokenAddress(newAddress);
        if (validated) {
          const { AssetsContractController } = Engine.context;
          const [tokenDecimals, tokenSymbol, tokenName] = await Promise.all([
            AssetsContractController.getERC20TokenDecimals(
              newAddress,
              networkClientId,
            ),
            AssetsContractController.getERC721AssetSymbol(
              newAddress,
              networkClientId,
            ),
            AssetsContractController.getERC20TokenName(
              newAddress,
              networkClientId,
            ),
          ]);

          setDecimals(String(tokenDecimals));
          setSymbol(tokenSymbol);
          setName(tokenName);
        } else {
          setIsSymbolEditable(true);
          setIsDecimalEditable(true);
        }
      } catch (e) {
        setIsSymbolEditable(true);
        setIsDecimalEditable(true);
      }
    } else {
      // We are cleaning other fields when changing the token address
      setDecimals('');
      setSymbol('');
      setName('');
      setWarningAddress('');
      setWarningSymbol('');
      setWarningDecimals('');
    }
  };

  const onSymbolChange = (newSymbol: string) => {
    setSymbol(newSymbol);
  };

  const onDecimalsChange = (newDecimals: string) => {
    setDecimals(newDecimals);
  };

  const jumpToAssetSymbol = () => {
    validateCustomToken();
    validateCustomTokenSymbol();
    setIsSymbolEditable(true);
  };

  const handleFocusAddress = () => {
    setOnFocusAddress(true);
  };

  const handleBlurAddress = () => {
    setOnFocusAddress(false);
  };

  const jumpToAssetPrecision = () => {
    const { current } = assetPrecisionInput;
    current?.focus();
  };

  const renderInfoBanner = () => (
    <Alert
      type={AlertType.Info}
      style={styles.tokenDetectionBanner}
      renderIcon={() => (
        <FontAwesome
          style={styles.tokenDetectionIcon}
          name={'exclamation-circle'}
          color={colors.primary.default}
          size={18}
        />
      )}
    >
      <>
        <Text style={styles.tokenDetectionDescription}>
          {strings('add_asset.banners.custom_info_desc')}
        </Text>
        <Text
          suppressHighlighting
          onPress={() => {
            navigation?.navigate('Webview', {
              screen: 'SimpleWebview',
              params: {
                url: AppConstants.URLS.SECURITY,
                title: strings('add_asset.banners.custom_security_tips'),
              },
            });
          }}
          style={styles.tokenDetectionLink}
        >
          {strings('add_asset.banners.custom_info_link')}
        </Text>
      </>
    </Alert>
  );

  const renderWarningBanner = () => {
    const goToWebView = () => {
      // TODO: This functionality exists in a bunch of other places. We need to unify this into a utils function
      navigation?.navigate('Webview', {
        screen: 'SimpleWebview',
        params: {
          url: AppConstants.URLS.SECURITY,
          title: strings('add_asset.banners.custom_security_tips'),
        },
      });
    };

    return (
      <View style={styles.tokenDetectionBanner}>
        <Banner
          variant={BannerVariant.Alert}
          severity={BannerAlertSeverity.Warning}
          description={
            <CLText>
              {strings('add_asset.banners.custom_warning_desc')}

              <CLText style={styles.link} onPress={() => goToWebView()}>
                {strings('add_asset.banners.custom_warning_link')}
              </CLText>
            </CLText>
          }
        />
      </View>
    );
  };

  const goToConfirmAddToken = () => {
    const selectedAsset = [
      {
        symbol,
        address,
        iconUrl: formatIconUrlWithProxy({
          chainId: chainId as `0x${string}`,
          tokenAddress: address,
        }),
        name,
        decimals,
        chainId,
      },
    ];

    navigation?.push('ConfirmAddAsset', {
      selectedAsset,
      networkName,
      chainId,
      ticker,
      addTokenList: addToken,
    });
  };

  const renderBanner = () =>
    isTokenDetectionSupported ? renderWarningBanner() : renderInfoBanner();

  const isDisabled = !symbol || !decimals || !selectedNetwork;

  const addressInputStyle = onFocusAddress
    ? { ...styles.textInput, ...styles.textInputFocus }
    : warningAddress
    ? styles.textInputError
    : styles.textInput;

  const textInputDecimalsStyle = !isDecimalEditable
    ? { ...styles.textInput, ...styles.textInputDisabled }
    : warningDecimals
    ? styles.textInputError
    : styles.textInput;

  const textInputSymbolStyle = !isSymbolEditable
    ? { ...styles.textInput, ...styles.textInputDisabled }
    : warningSymbol
    ? styles.textInputError
    : styles.textInput;

  const { title, url } = getBlockExplorerAddressUrl(type as string, address);

  return (
    <View style={styles.wrapper}>
      <ScrollView>
        {renderBanner()}
        <View style={styles.addressWrapper}>
          <TouchableOpacity
            style={styles.networkSelectorContainer}
            onPress={() => setOpenNetworkSelector?.(true)}
            onLongPress={() => setOpenNetworkSelector?.(true)}
          >
            <Text style={styles.networkSelectorText}>
              {selectedNetwork || strings('networks.select_network')}
            </Text>
            <View style={styles.overlappingAvatarsContainer}>
              {selectedNetwork ? (
                <Avatar
                  variant={AvatarVariant.Network}
                  size={AvatarSize.Sm}
                  name={selectedNetwork}
                  imageSource={getNetworkImageSource({
                    networkType: 'evm',
                    chainId: chainId as string,
                  })}
                  testID={ImportTokenViewSelectorsIDs.SELECT_NETWORK_BUTTON}
                />
              ) : null}

              <ButtonIcon
                iconName={IconName.ArrowDown}
                iconColor={IconColor.Default}
                testID={ImportTokenViewSelectorsIDs.SELECT_NETWORK_BUTTON}
                onPress={() => setOpenNetworkSelector?.(true)}
                accessibilityRole="button"
              />
            </View>
          </TouchableOpacity>
          <Text style={styles.inputLabel}>
            {strings('asset_details.address')}
          </Text>
          <TextInput
            style={addressInputStyle}
            placeholder={onFocusAddress ? '' : '0x...'}
            placeholderTextColor={colors.text.muted}
            value={address}
            onChangeText={onAddressChange}
            onFocus={handleFocusAddress}
            onBlur={() => {
              handleBlurAddress();
            }}
            testID={ImportTokenViewSelectorsIDs.ADDRESS_INPUT}
            onSubmitEditing={jumpToAssetSymbol}
            returnKeyType={'next'}
            keyboardAppearance={themeAppearance}
          />
          <Text
            style={styles.warningText}
            testID={ImportTokenViewSelectorsIDs.ADDRESS_WARNING_MESSAGE}
          >
            {warningAddress}
          </Text>
        </View>

        {address && !onFocusAddress && !warningAddress ? (
          <View style={styles.rowWrapper}>
            <Text style={styles.inputLabel}>
              {strings('token.token_symbol')}
            </Text>
            <TextInput
              style={textInputSymbolStyle}
              placeholder={'GNO'}
              placeholderTextColor={colors.text.muted}
              value={symbol}
              onChangeText={onSymbolChange}
              onBlur={validateCustomTokenSymbol}
              testID={ImportTokenViewSelectorsIDs.SYMBOL_INPUT}
              ref={assetSymbolInput}
              onSubmitEditing={jumpToAssetPrecision}
              returnKeyType={'next'}
              keyboardAppearance={themeAppearance}
              editable={isSymbolEditable}
            />
            <Text style={styles.warningText}>{warningSymbol}</Text>
          </View>
        ) : null}

        {address && !onFocusAddress && !warningAddress ? (
          <View style={styles.rowWrapper}>
            <Text style={styles.inputLabel}>
              {strings('token.token_decimal')}
            </Text>
            <TextInput
              style={textInputDecimalsStyle}
              value={decimals}
              keyboardType="numeric"
              maxLength={2}
              placeholder={'18'}
              placeholderTextColor={colors.text.muted}
              onChangeText={onDecimalsChange}
              onBlur={validateCustomTokenDecimals}
              testID={ImportTokenViewSelectorsIDs.DECIMAL_INPUT}
              ref={assetPrecisionInput}
              onSubmitEditing={addToken}
              returnKeyType={'done'}
              keyboardAppearance={themeAppearance}
              editable={isDecimalEditable}
            />

            {warningDecimals ? (
              <Text
                style={styles.warningText}
                testID={ImportTokenViewSelectorsIDs.PRECISION_WARNING_MESSAGE}
              >
                {warningDecimals}{' '}
                <Text
                  style={styles.link}
                  onPress={() => {
                    navigation?.navigate('Webview', {
                      screen: 'SimpleWebview',
                      params: {
                        url,
                        title,
                      },
                    });
                  }}
                >
                  {title}{' '}
                  <Icon
                    style={styles.link as StyleProp<ViewStyle>}
                    size={IconSize.Xss}
                    name={IconName.Export}
                  />
                </Text>{' '}
              </Text>
            ) : null}
          </View>
        ) : null}
      </ScrollView>
      <View style={styles.buttonWrapper}>
        <Button
          variant={ButtonVariants.Primary}
          size={ButtonSize.Lg}
          label={strings('transaction.next')}
          style={styles.import}
          onPress={goToConfirmAddToken}
          isDisabled={isDisabled}
          testID={ImportTokenViewSelectorsIDs.NEXT_BUTTON}
        />
      </View>
    </View>
  );
};

export default withMetricsAwareness(AddCustomToken);
