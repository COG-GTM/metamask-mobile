import React, { PureComponent } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ImageSourcePropType,
} from 'react-native';
import { connect } from 'react-redux';
import ActionSheet from '@metamask/react-native-actionsheet';
import { fontStyles } from '../../../../styles/common';
import CustomText from '../../../../components/Base/Text';
import { getNavigationOptionsTitle } from '../../../UI/Navbar';
import { strings } from '../../../../../locales/i18n';
import Networks, {
  getAllNetworks,
  getNetworkImageSource,
  isDefaultMainnet,
  isLineaMainnet,
  isMainNet,
  isTestNet,
} from '../../../../util/networks';
import StyledButton from '../../../UI/StyledButton';
import Engine from '../../../../core/Engine';
import { LINEA_MAINNET, MAINNET, RPC } from '../../../../constants/network';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { mockTheme, ThemeContext } from '../../../../util/theme';
import ImageIcons from '../../../UI/ImageIcon';
import { ADD_NETWORK_BUTTON } from '../../../../../wdio/screen-objects/testIDs/Screens/NetworksScreen.testids';
import { compareSanitizedUrl } from '../../../../util/sanitizeUrl';
import {
  selectEvmNetworkConfigurationsByChainId,
  selectProviderConfig,
} from '../../../../selectors/networkController';
import {
  AvatarSize,
  AvatarVariant,
} from '../../../../component-library/components/Avatars/Avatar';
import AvatarNetwork from '../../../../component-library/components/Avatars/Avatar/variants/AvatarNetwork';
import Routes from '../../../../constants/navigation/Routes';
import { NetworksViewSelectorsIDs } from '../../../../../e2e/selectors/Settings/NetworksView.selectors';
import { updateIncomingTransactions } from '../../../../util/transaction-controller';
import NetworkSearchTextInput from '../../NetworkSelector/NetworkSearchTextInput';
import { CHAIN_IDS } from '@metamask/transaction-controller';
import { isNonEvmChainId } from '../../../../core/Multichain/utils';
import { NavigationProp, ParamListBase } from '@react-navigation/native';
import { RootState } from '../../../../reducers';
///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
import { SolScope } from '@metamask/keyring-api';
import { selectNonEvmNetworkConfigurationsByChainId } from '../../../../selectors/multichainNetworkController';
///: END:ONLY_INCLUDE_IF

interface ThemeColors {
  background: {
    default: string;
    alternative?: string;
  };
  text: {
    default: string;
    alternative?: string;
  };
  border: {
    default: string;
    muted?: string;
  };
  icon: {
    default: string;
    alternative?: string;
  };
  primary: {
    default: string;
  };
}

interface Theme {
  colors: ThemeColors;
  themeAppearance: string;
}

interface RpcEndpoint {
  url: string;
  networkClientId: string;
  name?: string;
}

interface NetworkConfiguration {
  chainId: string;
  name?: string;
  rpcEndpoints: RpcEndpoint[];
  defaultRpcEndpointIndex: number;
}

interface ProviderConfig {
  rpcUrl?: string;
  type?: string;
  chainId?: string;
}

interface NetworksSettingsProps {
  networkConfigurations: Record<string, NetworkConfiguration>;
  navigation: NavigationProp<ParamListBase>;
  providerConfig: ProviderConfig;
  ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
  nonEvmNetworkConfigurations?: Record<string, { chainId: string; name: string }>;
  ///: END:ONLY_INCLUDE_IF
}

interface NetworksSettingsState {
  searchString: string;
  filteredNetworks: FilteredNetwork[];
}

interface FilteredNetwork {
  name: string;
  color: string | null;
  networkTypeOrRpcUrl: string;
  isCustomRPC: boolean;
  chainId: string;
  i?: number;
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    wrapper: {
      backgroundColor: colors.background.default,
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 24,
      marginBottom: 24,
    },
    networkIcon: {
      width: 20,
      height: 20,
      borderRadius: 10,
      marginTop: 2,
      marginRight: 16,
    },
    network: {
      flex: 1,
      flexDirection: 'row',
      paddingVertical: 12,
      alignItems: 'center',
    },
    networkDisabled: {
      opacity: 0.5,
    },
    networkWrapper: {
      flex: 0,
      flexDirection: 'row',
      alignItems: 'center',
    },
    networkLabel: {
      fontSize: 16,
      color: colors.text.default,
      ...fontStyles.normal,
    },
    sectionLabel: {
      fontSize: 14,
      paddingVertical: 12,
      color: colors.text.default,
      ...fontStyles.bold,
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 10,
      borderRadius: 5,
      borderWidth: 1,
      borderColor: colors.border.default,
      color: colors.text.default,
    },
    input: {
      flex: 1,
      fontSize: 14,
      color: colors.text.default,
      ...fontStyles.normal,
      paddingLeft: 10,
    },
    icon: {
      marginLeft: 8,
    },
    no_match_text: {
      marginVertical: 10,
    },
    text: {
      textAlign: 'center',
      color: colors.text.default,
      fontSize: 10,
      marginTop: 4,
    },
    mainnetHeader: {},
    networkInfo: {},
    networksWrapper: {},
    syncConfirm: {},
  });

/**
 * Main view for app configurations
 */
class NetworksSettings extends PureComponent<NetworksSettingsProps, NetworksSettingsState> {
  static contextType = ThemeContext;
  declare context: Theme;

  actionSheet: ActionSheet | null = null;
  networkToRemove: string | null = null;

  state: NetworksSettingsState = {
    searchString: '',
    filteredNetworks: [],
  };

  updateNavBar = (): void => {
    const { navigation } = this.props;
    const colors = this.context.colors || mockTheme.colors;
    navigation.setOptions(
      getNavigationOptionsTitle(
        strings('app_settings.networks_title'),
        navigation,
        false,
        colors,
      ),
    );
  };

  componentDidMount = (): void => {
    this.updateNavBar();
  };

  componentDidUpdate = (prevProps: NetworksSettingsProps): void => {
    if (this.props.networkConfigurations !== prevProps.networkConfigurations) {
      this.handleSearchTextChange(this.state.searchString);
    }

    this.updateNavBar();
  };

  getOtherNetworks = (): string[] => getAllNetworks().slice(2);

  onNetworkPress = (networkTypeOrRpcUrl: string): void => {
    const { navigation } = this.props;
    navigation.navigate(Routes.ADD_NETWORK, {
      network: networkTypeOrRpcUrl,
    });
  };

  onAddNetwork = (): void => {
    const { navigation } = this.props;
    navigation.navigate(Routes.ADD_NETWORK);
  };

  showRemoveMenu = (networkTypeOrRpcUrl: string): void => {
    this.networkToRemove = networkTypeOrRpcUrl;
    this.actionSheet?.show();
  };

  switchToMainnet = (): void => {
    const { NetworkController } = Engine.context;

    NetworkController.setProviderType(MAINNET);

    setTimeout(async () => {
      await updateIncomingTransactions();
    }, 1000);
  };

  removeNetwork = async (): Promise<void> => {
    // Check if it's the selected network and then switch to mainnet first
    const { providerConfig } = this.props;
    if (
      compareSanitizedUrl(providerConfig.rpcUrl || '', this.networkToRemove || '') &&
      providerConfig.type === RPC
    ) {
      this.switchToMainnet();
    }
    const { NetworkController, MultichainNetworkController } = Engine.context;

    const { networkConfigurations } = this.props;
    const entry = Object.entries(networkConfigurations).find(
      ([, networkConfiguration]) =>
        networkConfiguration.rpcEndpoints.some(
          (rpcEndpoint) => rpcEndpoint.networkClientId === this.networkToRemove,
        ),
    );

    const selectedNetworkClientId =
      NetworkController.state.selectedNetworkClientId;

    if (!entry) {
      throw new Error(
        `Unable to find network with RPC URL ${this.networkToRemove}`,
      );
    }

    const [chainId] = entry;

    if (this.networkToRemove === selectedNetworkClientId) {
      // if we delete selected network, switch to mainnet before removing the selected network
      await MultichainNetworkController.setActiveNetwork('mainnet');
    }

    NetworkController.removeNetwork(chainId);
    this.setState({ filteredNetworks: [] });
  };

  createActionSheetRef = (ref: ActionSheet | null): void => {
    this.actionSheet = ref;
  };

  onActionSheetPress = (index: number): void => {
    if (index === 0) {
      this.removeNetwork();
    }
  };

  networkElement(
    name: string,
    image: ImageSourcePropType | string | null,
    i: number,
    networkTypeOrRpcUrl: string,
    isCustomRPC: boolean,
    color?: string,
  ): React.ReactNode {
    const colors = this.context.colors || mockTheme.colors;
    const styles = createStyles(colors);
    return (
      <View key={`network-${networkTypeOrRpcUrl}`}>
        {
          // Do not change. This logic must check for 'mainnet' and is used for rendering the out of the box mainnet when searching.
          isDefaultMainnet(networkTypeOrRpcUrl) ? (
            this.renderMainnet()
          ) : isLineaMainnet(networkTypeOrRpcUrl) ? (
            this.renderLineaMainnet()
          ) : (
            <TouchableOpacity
              key={`network-${i}`}
              onPress={() => this.onNetworkPress(networkTypeOrRpcUrl)}
              onLongPress={() =>
                isCustomRPC && this.showRemoveMenu(networkTypeOrRpcUrl)
              }
            >
              <View style={styles.network}>
                {isCustomRPC ? (
                  <AvatarNetwork
                    variant={AvatarVariant.Network}
                    name={name}
                    imageSource={image as ImageSourcePropType}
                    style={styles.networkIcon}
                    size={AvatarSize.Xs}
                  />
                ) : null}
                {!isCustomRPC &&
                  (image ? (
                    <ImageIcons
                      image={networkTypeOrRpcUrl.toUpperCase()}
                      style={styles.networkIcon}
                    />
                  ) : (
                    <View
                      style={[styles.networkIcon, { backgroundColor: color }]}
                    >
                      <Text style={styles.text}>{name[0]}</Text>
                    </View>
                  ))}
                <Text style={styles.networkLabel}>{name}</Text>
                {!isCustomRPC && (
                  <FontAwesome
                    name="lock"
                    size={20}
                    color={colors.icon.default}
                    style={styles.icon}
                  />
                )}
              </View>
            </TouchableOpacity>
          )
        }
      </View>
    );
  }

  renderOtherNetworks(): React.ReactNode {
    return this.getOtherNetworks().map((networkType, i) => {
      const networkConfig = Networks[networkType] as { name: string; imageSource?: ImageSourcePropType; color?: string };
      const { name, imageSource, color } = networkConfig;
      return this.networkElement(
        name,
        imageSource || null,
        i,
        networkType,
        false,
        color,
      );
    });
  }

  renderRpcNetworks = (): React.ReactNode => {
    const { networkConfigurations } = this.props;
    return Object.values(networkConfigurations).map(
      (
        { rpcEndpoints, name: nickname, chainId, defaultRpcEndpointIndex },
        i,
      ) => {
        if (
          !chainId ||
          isTestNet(chainId) ||
          isMainNet(chainId) ||
          chainId === CHAIN_IDS.LINEA_MAINNET ||
          chainId === CHAIN_IDS.GOERLI ||
          isNonEvmChainId(chainId)
        ) {
          return null;
        }
        const rpcName = rpcEndpoints[defaultRpcEndpointIndex].name ?? '';
        const rpcUrl = rpcEndpoints[defaultRpcEndpointIndex].networkClientId;
        const name = nickname || rpcName;
        const image = getNetworkImageSource({ chainId });
        return this.networkElement(name, image, i, rpcUrl, true);
      },
    );
  };

  renderRpcNetworksView = (): React.ReactNode => {
    const { networkConfigurations } = this.props;
    // Define the chainIds to exclude (Mainnet and Linea)
    const excludedChainIds = [
      CHAIN_IDS.MAINNET,
      CHAIN_IDS.LINEA_MAINNET,
      CHAIN_IDS.GOERLI,
      CHAIN_IDS.LINEA_GOERLI,
      CHAIN_IDS.SEPOLIA,
      CHAIN_IDS.LINEA_SEPOLIA,
    ];

    const filteredChain = Object.keys(networkConfigurations).reduce<Record<string, NetworkConfiguration>>(
      (filtered, key) => {
        const network = networkConfigurations[key];
        // If the chainId is not in the excludedChainIds, add it to the result
        if (!excludedChainIds.includes(network.chainId as typeof CHAIN_IDS[keyof typeof CHAIN_IDS])) {
          filtered[key] = network;
        }
        return filtered;
      },
      {},
    );

    const colors = this.context.colors || mockTheme.colors;
    const styles = createStyles(colors);

    if (Object.keys(filteredChain).length > 0) {
      return (
        <View testID={NetworksViewSelectorsIDs.CUSTOM_NETWORK_LIST}>
          <Text style={styles.sectionLabel}>
            {strings('app_settings.custom_network_name')}
          </Text>
          {this.renderRpcNetworks()}
        </View>
      );
    }
    return null;
  };

  renderMainnet(): React.ReactNode {
    const networkConfig = Networks.mainnet as { name: string };
    const { name: mainnetName } = networkConfig;
    const colors = this.context.colors || mockTheme.colors;
    const styles = createStyles(colors);

    return (
      <View style={styles.mainnetHeader}>
        <TouchableOpacity
          style={styles.network}
          key={`network-${MAINNET}`}
          onPress={() => this.onNetworkPress(MAINNET)}
        >
          <View style={styles.networkWrapper}>
            <ImageIcons image="ETHEREUM" style={styles.networkIcon} />
            <View style={styles.networkInfo}>
              <Text style={styles.networkLabel}>{mainnetName}</Text>
            </View>
          </View>
          <FontAwesome
            name="lock"
            size={20}
            color={colors.icon.default}
            style={styles.icon}
          />
        </TouchableOpacity>
      </View>
    );
  }

  renderLineaMainnet(): React.ReactNode {
    const networkConfig = Networks['linea-mainnet'] as { name: string };
    const { name: lineaMainnetName } = networkConfig;
    const colors = this.context.colors || mockTheme.colors;
    const styles = createStyles(colors);

    return (
      <View style={styles.mainnetHeader}>
        <TouchableOpacity
          style={styles.network}
          key={`network-${LINEA_MAINNET}`}
          onPress={() => this.onNetworkPress(LINEA_MAINNET)}
        >
          <View style={styles.networkWrapper}>
            <ImageIcons image="LINEA-MAINNET" style={styles.networkIcon} />
            <View style={styles.networkInfo}>
              <Text style={styles.networkLabel}>{lineaMainnetName}</Text>
            </View>
          </View>
          <FontAwesome
            name="lock"
            size={20}
            color={colors.icon.default}
            style={styles.icon}
          />
        </TouchableOpacity>
      </View>
    );
  }

  ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
  renderSolanaMainnet(): React.ReactNode {
    // TODO: [SOLANA] - Please revisit this since it's supported on a constant array in mobile and should come from multichain network controller
    const nonEvmConfigs = this.props.nonEvmNetworkConfigurations || {};
    const solanaNetwork = Object.values(nonEvmConfigs).find(
      (network) => network.chainId === SolScope.Mainnet,
    );
    const solanaMainnetName = solanaNetwork?.name || 'Solana';
    const colors = this.context.colors || mockTheme.colors;
    const styles = createStyles(colors);

    return (
      <View style={styles.mainnetHeader}>
        <TouchableOpacity
          style={{ ...styles.network, ...styles.networkDisabled }}
          key={`network-${solanaMainnetName}`}
          onPress={() => null}
          disabled
        >
          <View style={styles.networkWrapper}>
            <ImageIcons image={'SOLANA'} style={styles.networkIcon} />
            <View style={styles.networkInfo}>
              <Text style={styles.networkLabel}>{solanaMainnetName}</Text>
            </View>
          </View>
          <FontAwesome
            name="lock"
            size={20}
            color={colors.icon.default}
            style={styles.icon}
          />
        </TouchableOpacity>
      </View>
    );
  }
  ///: END:ONLY_INCLUDE_IF

  handleSearchTextChange = (text: string): void => {
    this.setState({ searchString: text });
    const defaultNetwork = getAllNetworks().map((networkType) => {
      const networkConfig = Networks[networkType] as { color?: string; name: string; chainId: string };
      const { color, name, chainId } = networkConfig;
      return {
        name,
        color: color || null,
        networkTypeOrRpcUrl: networkType,
        isCustomRPC: false,
        chainId,
      };
    });
    const customRPC = Object.values(this.props.networkConfigurations).map(
      (networkConfiguration, i) => {
        const defaultRpcEndpoint =
          networkConfiguration.rpcEndpoints[
            networkConfiguration.defaultRpcEndpointIndex
          ];
        const { color, name, url, chainId } = {
          name: networkConfiguration.name || defaultRpcEndpoint.url,
          url: defaultRpcEndpoint.url,
          color: null,
          chainId: networkConfiguration.chainId,
        };
        return {
          name,
          color,
          i,
          networkTypeOrRpcUrl: url,
          isCustomRPC: true,
          chainId,
        };
      },
    );

    const allActiveNetworks = [...defaultNetwork, ...customRPC];
    const searchResult = allActiveNetworks.filter(({ name }) =>
      name?.toLowerCase().includes(text.toLowerCase()),
    );
    this.setState({ filteredNetworks: searchResult });
  };

  clearSearchInput = (): void =>
    this.setState({ searchString: '', filteredNetworks: [] });

  filteredResult = (): React.ReactNode => {
    const colors = this.context.colors || mockTheme.colors;
    const styles = createStyles(colors);
    if (this.state.filteredNetworks.length > 0) {
      return this.state.filteredNetworks.map((data, i) => {
        const { networkTypeOrRpcUrl, chainId, name, color, isCustomRPC } = data;
        const image = getNetworkImageSource({ chainId });
        return (
          // TODO: remove this check when linea mainnet is ready
          networkTypeOrRpcUrl !== LINEA_MAINNET &&
          this.networkElement(
            name,
            image || color,
            i,
            networkTypeOrRpcUrl,
            isCustomRPC,
          )
        );
      });
    }
    return (
      <CustomText style={styles.no_match_text}>
        {strings('networks.no_match')}
      </CustomText>
    );
  };

  render(): React.ReactNode {
    const colors = this.context.colors || mockTheme.colors;
    const themeAppearance = this.context.themeAppearance;
    const styles = createStyles(colors);

    return (
      <View
        style={styles.wrapper}
        testID={NetworksViewSelectorsIDs.NETWORK_CONTAINER}
      >
        {
          <NetworkSearchTextInput
            searchString={this.state.searchString}
            handleSearchTextChange={this.handleSearchTextChange}
            clearSearchInput={this.clearSearchInput}
            testIdSearchInput={
              NetworksViewSelectorsIDs.SEARCH_NETWORK_INPUT_BOX_ID
            }
            testIdCloseIcon={NetworksViewSelectorsIDs.CLOSE_ICON}
          />
        }
        <ScrollView style={styles.networksWrapper}>
          {this.state.searchString.length > 0 ? (
            this.filteredResult()
          ) : (
            <>
              <Text style={styles.sectionLabel}>
                {strings('app_settings.mainnet')}
              </Text>
              {this.renderMainnet()}
              {this.renderLineaMainnet()}
              {
                ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
                this.renderSolanaMainnet()
                ///: END:ONLY_INCLUDE_IF
              }
              {this.renderRpcNetworksView()}
              <Text style={styles.sectionLabel}>
                {strings('app_settings.test_network_name')}
              </Text>
              {this.renderOtherNetworks()}
            </>
          )}
        </ScrollView>
        <StyledButton
          type="confirm"
          onPress={this.onAddNetwork}
          containerStyle={styles.syncConfirm}
          testID={ADD_NETWORK_BUTTON}
        >
          {strings('app_settings.network_add_network')}
        </StyledButton>
        <ActionSheet
          ref={this.createActionSheetRef}
          title={strings('app_settings.remove_network_title')}
          options={[
            strings('app_settings.remove_network'),
            strings('app_settings.cancel_remove_network'),
          ]}
          cancelButtonIndex={1}
          destructiveButtonIndex={0}
          onPress={this.onActionSheetPress}
          theme={themeAppearance}
        />
      </View>
    );
  }
}

const mapStateToProps = (state: RootState) => ({
  providerConfig: selectProviderConfig(state),
  networkConfigurations: selectEvmNetworkConfigurationsByChainId(state),
  ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
  nonEvmNetworkConfigurations:
    selectNonEvmNetworkConfigurationsByChainId(state),
  ///: END:ONLY_INCLUDE_IF
});

export default connect(mapStateToProps)(NetworksSettings);
