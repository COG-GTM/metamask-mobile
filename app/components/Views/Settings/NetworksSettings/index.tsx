import React, { PureComponent } from 'react';
import type { RootState } from '../../../../reducers';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type ImageSourcePropType,
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
///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
import { SolScope } from '@metamask/keyring-api';
import { selectNonEvmNetworkConfigurationsByChainId } from '../../../../selectors/multichainNetworkController';
///: END:ONLY_INCLUDE_IF

interface ThemeColors {
  background: { default: string };
  border: { default: string };
  text: { default: string };
  icon: { default: string };
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
    mainnetHeader: {} as Record<string, never>,
    networkInfo: {} as Record<string, never>,
    networksWrapper: {} as Record<string, never>,
    syncConfirm: {} as Record<string, never>,
  });

interface NetworksNavigation {
  setOptions: (options: object) => void;
  navigate: (route: string, params?: object) => void;
  goBack?: () => void;
}

interface RpcEndpoint {
  name?: string;
  url: string;
  networkClientId: string;
}

interface NetworkConfiguration {
  name?: string;
  chainId: string;
  rpcEndpoints: RpcEndpoint[];
  defaultRpcEndpointIndex: number;
}

interface ProviderConfig {
  rpcUrl?: string;
  type: string;
}

interface OwnProps {
  navigation?: NetworksNavigation;
}

interface StateProps {
  providerConfig: ProviderConfig;
  networkConfigurations: Record<string, NetworkConfiguration>;
  ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
  nonEvmNetworkConfigurations: Record<string, { chainId: string; name: string }>;
  ///: END:ONLY_INCLUDE_IF
}

type Props = OwnProps & StateProps;

interface FilteredNetwork {
  name: string;
  color: string | null;
  networkTypeOrRpcUrl: string;
  isCustomRPC: boolean;
  chainId: string;
}

interface State {
  searchString: string;
  filteredNetworks: FilteredNetwork[];
}

interface ActionSheetRef {
  show: () => void;
}

/**
 * Main view for app configurations
 */
class NetworksSettings extends PureComponent<Props, State> {
  static contextType = ThemeContext;


  actionSheet: ActionSheetRef | null = null;
  networkToRemove: string | null = null;

  state: State = {
    searchString: '',
    filteredNetworks: [],
  };

  updateNavBar = () => {
    const { navigation } = this.props;
    const colors =
      (this.context as { colors?: typeof mockTheme.colors })?.colors ||
      mockTheme.colors;
    navigation?.setOptions(
      getNavigationOptionsTitle(
        strings('app_settings.networks_title'),
        navigation,
        false,
        colors,
      ),
    );
  };

  componentDidMount = () => {
    this.updateNavBar();
  };

  componentDidUpdate = (prevProps: Props) => {
    if (this.props.networkConfigurations !== prevProps.networkConfigurations) {
      this.handleSearchTextChange(this.state.searchString);
    }

    this.updateNavBar();
  };

  getOtherNetworks = () => getAllNetworks().slice(2);

  onNetworkPress = (networkTypeOrRpcUrl: string) => {
    const { navigation } = this.props;
    navigation?.navigate(Routes.ADD_NETWORK, {
      network: networkTypeOrRpcUrl,
    });
  };

  onAddNetwork = () => {
    const { navigation } = this.props;
    navigation?.navigate(Routes.ADD_NETWORK);
  };

  showRemoveMenu = (networkTypeOrRpcUrl: string) => {
    this.networkToRemove = networkTypeOrRpcUrl;
    this.actionSheet?.show();
  };

  switchToMainnet = () => {
    const { NetworkController } = Engine.context;

    NetworkController.setProviderType(MAINNET);

    setTimeout(async () => {
      await updateIncomingTransactions();
    }, 1000);
  };

  removeNetwork = async () => {
    // Check if it's the selected network and then switch to mainnet first
    const { providerConfig } = this.props;
    if (
      compareSanitizedUrl(
        providerConfig.rpcUrl as string,
        this.networkToRemove as string,
      ) &&
      providerConfig.type === RPC
    ) {
      this.switchToMainnet();
    }
    const { NetworkController, MultichainNetworkController } = Engine.context;

    const { networkConfigurations } = this.props;
    const entry = Object.entries(networkConfigurations).find(
      ([, networkConfiguration]) =>
        networkConfiguration.rpcEndpoints.some(
          (rpcEndpoint: RpcEndpoint) =>
            rpcEndpoint.networkClientId === this.networkToRemove,
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

    NetworkController.removeNetwork(chainId as Parameters<typeof NetworkController.removeNetwork>[0]);
    this.setState({ filteredNetworks: [] });
  };

  createActionSheetRef = (ref: ActionSheetRef | null) => {
    this.actionSheet = ref;
  };

  onActionSheetPress = (index: number) =>
    index === 0 ? this.removeNetwork() : null;

  networkElement(
    name: string,
    image: ImageSourcePropType | string | null | undefined,
    i: number,
    networkTypeOrRpcUrl: string,
    isCustomRPC: boolean,
    color?: string | null,
  ) {
    const colors =
      (this.context as { colors?: typeof mockTheme.colors })?.colors ||
      mockTheme.colors;
    const styles = createStyles(colors as ThemeColors);
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
                    {...({ variant: AvatarVariant.Network } as Record<string, unknown>)}
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
                      style={[
                        styles.networkIcon,
                        { backgroundColor: color ?? undefined },
                      ]}
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

  renderOtherNetworks() {
    return this.getOtherNetworks().map((networkType: string, i: number) => {
      const { name, imageSource, color } = (
        Networks as unknown as Record<
          string,
          { name: string; imageSource: ImageSourcePropType; color: string }
        >
      )[networkType];
      return this.networkElement(
        name,
        imageSource,
        i,
        networkType,
        false,
        color,
      );
    });
  }

  renderRpcNetworks = () => {
    const { networkConfigurations } = this.props;
    return Object.values(networkConfigurations).map(
      (
        {
          rpcEndpoints,
          name: nickname,
          chainId,
          defaultRpcEndpointIndex,
        }: NetworkConfiguration,
        i: number,
      ) => {
        if (
          !chainId ||
          isTestNet(chainId as `0x${string}`) ||
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
        const image = getNetworkImageSource({ chainId: chainId as `0x${string}` });
        return this.networkElement(name, image, i, rpcUrl, true);
      },
    );
  };

  renderRpcNetworksView = () => {
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

    const filteredChain = Object.keys(networkConfigurations).reduce(
      (filtered: Record<string, NetworkConfiguration>, key: string) => {
        const network = networkConfigurations[key];
        // If the chainId is not in the excludedChainIds, add it to the result
        if (
          !(excludedChainIds as string[]).includes(network.chainId)
        ) {
          filtered[key] = network;
        }
        return filtered;
      },
      {},
    );

    const colors =
      (this.context as { colors?: typeof mockTheme.colors })?.colors ||
      mockTheme.colors;
    const styles = createStyles(colors as ThemeColors);

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
  };

  renderMainnet() {
    const { name: mainnetName } = Networks.mainnet;
    const colors =
      (this.context as { colors?: typeof mockTheme.colors })?.colors ||
      mockTheme.colors;
    const styles = createStyles(colors as ThemeColors);

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

  renderLineaMainnet() {
    const { name: lineaMainnetName } = Networks['linea-mainnet'];
    const colors =
      (this.context as { colors?: typeof mockTheme.colors })?.colors ||
      mockTheme.colors;
    const styles = createStyles(colors as ThemeColors);

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
  renderSolanaMainnet() {
    // TODO: [SOLANA] - Please revisit this since it's supported on a constant array in mobile and should come from multichain network controller
    const solanaNetwork = Object.values(
      this.props.nonEvmNetworkConfigurations,
    ).find(
      (network: { chainId: string; name: string }) =>
        network.chainId === SolScope.Mainnet,
    );
    const solanaMainnetName = solanaNetwork?.name ?? '';
    const colors =
      (this.context as { colors?: typeof mockTheme.colors })?.colors ||
      mockTheme.colors;
    const styles = createStyles(colors as ThemeColors);

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
  handleSearchTextChange = (text: string) => {
    this.setState({ searchString: text });
    const defaultNetwork = getAllNetworks().map(
      (networkType: string) => {
        const { color, name, chainId } = (
          Networks as unknown as Record<
            string,
            { color: string; name: string; chainId: string }
          >
        )[networkType];
        return {
          name,
          color,
          networkTypeOrRpcUrl: networkType,
          isCustomRPC: false,
          chainId,
        };
      },
    );
    const customRPC = Object.values(this.props.networkConfigurations).map(
      (networkConfiguration: NetworkConfiguration, i: number) => {
        const defaultRpcEndpoint =
          networkConfiguration.rpcEndpoints[
            networkConfiguration.defaultRpcEndpointIndex
          ];
        const { color, name, url, chainId } = {
          name: networkConfiguration.name || defaultRpcEndpoint.url,
          url: defaultRpcEndpoint.url,
          color: null as string | null,
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

    const allActiveNetworks = defaultNetwork.concat(
      customRPC as unknown as typeof defaultNetwork,
    );
    const searchResult = allActiveNetworks.filter(({ name }) =>
      name?.toLowerCase().includes(text.toLowerCase()),
    );
    this.setState({
      filteredNetworks: searchResult as unknown as FilteredNetwork[],
    });
  };

  clearSearchInput = () =>
    this.setState({ searchString: '', filteredNetworks: [] });

  filteredResult = () => {
    const colors =
      (this.context as { colors?: typeof mockTheme.colors })?.colors ||
      mockTheme.colors;
    const styles = createStyles(colors as ThemeColors);
    if (this.state.filteredNetworks.length > 0) {
      return this.state.filteredNetworks.map(
        (data: FilteredNetwork, i: number) => {
          const { networkTypeOrRpcUrl, chainId, name, color, isCustomRPC } =
            data;
          const image = getNetworkImageSource({ chainId: chainId as `0x${string}` });
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
        },
      );
    }
    return (
      <CustomText style={styles.no_match_text}>
        {strings('networks.no_match')}
      </CustomText>
    );
  };

  render() {
    const colors =
      (this.context as { colors?: typeof mockTheme.colors })?.colors ||
      mockTheme.colors;
    const themeAppearance =
      (this.context as { themeAppearance?: string })?.themeAppearance;
    const styles = createStyles(colors as ThemeColors);

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

const mapStateToProps = (state: RootState): StateProps => ({
  providerConfig: selectProviderConfig(state) as unknown as ProviderConfig,
  networkConfigurations: selectEvmNetworkConfigurationsByChainId(
    state,
  ) as unknown as Record<string, NetworkConfiguration>,
  ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
  nonEvmNetworkConfigurations: selectNonEvmNetworkConfigurationsByChainId(
    state,
  ) as unknown as Record<string, { chainId: string; name: string }>,
  ///: END:ONLY_INCLUDE_IF
});

export default connect(mapStateToProps)(NetworksSettings);
