import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  StyleSheet,
  View,
  Easing,
  Animated,
  SafeAreaView,
  TouchableWithoutFeedback,
 LayoutChangeEvent } from 'react-native';
import RemoteImage from '../../Base/RemoteImage';
import { connect, useSelector } from 'react-redux';
import { baseStyles } from '../../../styles/common';
import { strings } from '../../../../locales/i18n';
import Text from '../../Base/Text';
import StyledButton from '../../UI/StyledButton';
import EvilIcons from 'react-native-vector-icons/EvilIcons';
import AntIcons from 'react-native-vector-icons/AntDesign';
import Device from '../../../util/device';
import { isIPFSUri, renderShortText } from '../../../util/general';
import { toLocaleDate } from '../../../util/date';
import { renderFromWei } from '../../../util/number';
import { renderShortAddress } from '../../../util/address';
import { isMainNet } from '../../../util/networks';
import { isLinkSafe } from '../../../util/linkCheck';
import etherscanLink from '@metamask/etherscan-link';
import {
  addFavoriteCollectible as addFavoriteCollectibleAction,
  removeFavoriteCollectible as removeFavoriteCollectibleAction,
} from '../../../actions/collectibles';
import { isCollectibleInFavoritesSelector } from '../../../reducers/collectibles';
import Share from 'react-native-share';
import {
  PanGestureHandler,
  gestureHandlerRootHOC,
  ScrollView,
 GestureEvent, PanGestureHandlerEventPayload } from 'react-native-gesture-handler';
import AppConstants from '../../../core/AppConstants';
import { useTheme } from '../../../util/theme';
import { selectChainId } from '../../../selectors/networkController';
import {
  selectDisplayNftMedia,
  selectIsIpfsGatewayEnabled,
} from '../../../selectors/preferencesController';
import { selectSelectedInternalAccountFormattedAddress } from '../../../selectors/accountsController';
import { Colors } from '../../../util/theme/models';
import { RootState } from '../../../reducers';
import { ThunkDispatch, AnyAction } from '@reduxjs/toolkit';
import { NavigationProp, ParamListBase } from '@react-navigation/native';

const PanGestureHandlerWithChildren =
  PanGestureHandler as React.ComponentType<
    React.ComponentProps<typeof PanGestureHandler> & {
      children?: React.ReactNode;
    }
  >;

const ANIMATION_VELOCITY = 250;
const HAS_NOTCH = Device.hasNotch();
const ANIMATION_OFFSET = HAS_NOTCH ? 30 : 50;
const IS_SMALL_DEVICE = Device.isSmallDevice();
const VERTICAL_ALIGNMENT = IS_SMALL_DEVICE ? 12 : 16;

const THRESHOLD = 50;

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    wrapper: {
      flex: 0,
      backgroundColor: colors.background.default,
      borderTopEndRadius: 8,
      borderTopStartRadius: 8,
    },
    generalContainer: {
      paddingHorizontal: 16,
    },
    information: {
      paddingTop: HAS_NOTCH ? 24 : VERTICAL_ALIGNMENT,
    },
    row: {
      paddingVertical: 6,
    },
    name: {
      fontSize: Device.isSmallDevice() ? 16 : 24,
      marginBottom: 3,
    },
    userContainer: {
      flexDirection: 'row',
      paddingBottom: 16,
      alignItems: 'center',
    },
    userImage: {
      width: 38,
      height: 38,
      borderRadius: 100,
      marginRight: 8,
    },
    buttonContainer: {
      flexDirection: 'row',
      marginTop: VERTICAL_ALIGNMENT,
    },
    button: {
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.5,
    },
    iconButtons: {
      width: 54,
      height: 54,
    },
    leftButton: {
      marginRight: 16,
    },
    collectibleInfoContainer: {
      flexDirection: 'row',
      marginHorizontal: 16,
      marginBottom: 8,
    },
    collectibleInfoKey: {
      paddingRight: 10,
    },
    collectibleDescription: {
      lineHeight: 22,
    },
    userInfoContainer: {
      justifyContent: 'center',
      marginLeft: 8,
    },
    titleWrapper: {
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: VERTICAL_ALIGNMENT,
    },
    dragger: {
      width: 48,
      height: 5,
      borderRadius: 4,
      backgroundColor: colors.border.default,
    },
    scrollableDescription: {
      maxHeight: Device.getDeviceHeight() / 5,
    },
    description: {
      marginTop: 8,
    },
  });

const FieldType = {
  Link: 'Link',
  Text: 'Text',
};
/**
 * View that displays the information of a specific ERC-721 Token
 */
interface OpenSeaLastSale {
  event_timestamp?: string;
  total_price?: string;
}

interface OpenSeaCreator {
  user?: { username?: string };
}

interface CollectibleData {
  description?: string | null;
  standard?: string | null;
  lastSale?: unknown;
  imageOriginal?: string | null;
  externalLink?: string | null;
  address?: string | null;
  creator?: unknown;
  logo?: string | null;
  name?: string | null;
  tokenId?: string | number;
  contractName?: string | null;
  [key: string]: unknown;
}

interface CollectibleOverviewProps {
  chainId?: string;
  navigation?: NavigationProp<ParamListBase>;
  collectible: CollectibleData;
  selectedAddress?: string;
  tradable?: boolean;
  onSend?: () => void;
  addFavoriteCollectible?: (
    selectedAddress: string | undefined,
    chainId: string | undefined,
    collectible: CollectibleData,
  ) => void;
  removeFavoriteCollectible?: (
    selectedAddress: string | undefined,
    chainId: string | undefined,
    collectible: CollectibleData,
  ) => void;
  isInFavorites?: boolean;
  openLink?: (url: string) => void;
  onTranslation?: (translated: boolean) => void;
}

const CollectibleOverview = ({
  chainId,
  collectible,
  selectedAddress,
  tradable,
  onSend,
  addFavoriteCollectible,
  removeFavoriteCollectible,
  isInFavorites,
  openLink,
  onTranslation,
}: CollectibleOverviewProps) => {
  const [headerHeight, setHeaderHeight] = useState(0);
  const [prevWrapperHeight, setPrevWrapperHeight] = useState(0);
  const [wrapperHeight, setWrapperHeight] = useState(0);
  const [position, setPosition] = useState(0);
  const positionAnimated = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const isIpfsGatewayEnabled = useSelector(selectIsIpfsGatewayEnabled);
  const displayNftMedia = useSelector(selectDisplayNftMedia);

  const translationHeight = useMemo(
    () => wrapperHeight - headerHeight - ANIMATION_OFFSET,
    [headerHeight, wrapperHeight],
  );
  const animating = useRef(false);

  const renderScrollableDescription = useMemo(() => {
    const maxLength = IS_SMALL_DEVICE ? 150 : 300;
    return (collectible?.description?.length ?? 0) > maxLength;
  }, [collectible.description]);

  const renderCollectibleInfoRow = useCallback(
    ({
      key,
      value,
      onPress,
      type,
    }: {
      key: string;
      value?: string | false | null;
      onPress?: () => void;
      type: string;
    }) => {
      if (!value) return null;
      if (type === FieldType.Link) {
        if (!isLinkSafe(value)) return null;
      }
      return (
        <View style={styles.collectibleInfoContainer} key={key}>
          <Text
            noMargin
            black
            bold
            big={!IS_SMALL_DEVICE}
            style={styles.collectibleInfoKey}
          >
            {key}
          </Text>
          <Text
            noMargin
            big={!IS_SMALL_DEVICE}
            link={!!onPress}
            black={!onPress}
            right
            style={baseStyles.flexGrow}
            numberOfLines={1}
            ellipsizeMode="middle"
            onPress={onPress}
          >
            {value}
          </Text>
        </View>
      );
    },
    [styles],
  );

  const renderCollectibleInfo = () => [
    renderCollectibleInfoRow({
      key: strings('collectible.collectible_token_standard'),
      value: collectible?.standard,
      type: FieldType.Text,
    }),
    renderCollectibleInfoRow({
      key: strings('collectible.collectible_last_sold'),
      value:
        (collectible?.lastSale as OpenSeaLastSale)?.event_timestamp &&
        toLocaleDate(
          new Date(
            (collectible?.lastSale as OpenSeaLastSale).event_timestamp as string,
          ),
        ).toString(),
      type: FieldType.Text,
    }),
    renderCollectibleInfoRow({
      key: strings('collectible.collectible_last_price_sold'),
      value:
        (collectible?.lastSale as OpenSeaLastSale)?.total_price &&
        `${renderFromWei(
          (collectible?.lastSale as OpenSeaLastSale).total_price as string,
        )} ETH`,
      type: FieldType.Text,
    }),
    renderCollectibleInfoRow({
      key: strings('collectible.collectible_source'),
      value: collectible?.imageOriginal,
      onPress: () => openLink?.(collectible?.imageOriginal as string),
      type: FieldType.Link,
    }),
    renderCollectibleInfoRow({
      key: strings('collectible.collectible_link'),
      value: collectible?.externalLink,
      onPress: () => openLink?.(collectible?.externalLink as string),
      type: FieldType.Link,
    }),
    renderCollectibleInfoRow({
      key: strings('collectible.collectible_asset_contract'),
      value: renderShortAddress(collectible?.address as string),
      onPress: () => {
        if (isMainNet(chainId as string))
          openLink?.(
            etherscanLink.createTokenTrackerLink(
              collectible?.address as string,
              chainId as string,
            ),
          );
      },
      type: FieldType.Text,
    }),
  ];

  const collectibleToFavorites = useCallback(() => {
    const action = isInFavorites
      ? removeFavoriteCollectible
      : addFavoriteCollectible;
    action?.(selectedAddress, chainId, collectible);
  }, [
    selectedAddress,
    chainId,
    collectible,
    isInFavorites,
    addFavoriteCollectible,
    removeFavoriteCollectible,
  ]);

  const shareCollectible = useCallback(() => {
    if (!collectible?.externalLink) return;
    Share.open({
      message: `${strings('collectible.share_check_out_nft')} ${
        collectible.externalLink
      }\n${strings('collectible.share_via')} ${
        AppConstants.SHORT_HOMEPAGE_URL
      }`,
    });
  }, [collectible.externalLink]);

  const onHeaderLayout = useCallback(
    ({
      nativeEvent: {
        layout: { height },
      },
    }: LayoutChangeEvent) => setHeaderHeight(height),
    [],
  );

  const onWrapperLayout = useCallback(
    ({
      nativeEvent: {
        layout: { height },
      },
    }: LayoutChangeEvent) => {
      //This condition is needed to prevent bouncing when the component is rendered
      if (Math.abs(height - prevWrapperHeight) > THRESHOLD) {
        setWrapperHeight(height);
        setPrevWrapperHeight(height);
      }
    },
    [prevWrapperHeight],
  );

  const animateViewPosition = useCallback(
    (toValue: number, duration: number) => {
      animating.current = true;
      Animated.timing(positionAnimated, {
        toValue,
        duration,
        easing: Easing.ease,
        useNativeDriver: true,
      }).start(() => {
        setPosition(toValue);
        animating.current = false;
      });
    },
    [positionAnimated],
  );

  const handleGesture = useCallback(
    (evt: GestureEvent<PanGestureHandlerEventPayload>) => {
      // we don't want to trigger the animation again when the view is being animated
      if (evt.nativeEvent.velocityY === 0 || animating.current) return;
      const toValue = evt.nativeEvent.velocityY > 0 ? translationHeight : 0;
      if (toValue !== position) {
        onTranslation?.(toValue !== 0);
        animateViewPosition(toValue, ANIMATION_VELOCITY);
      }
    },
    [translationHeight, position, onTranslation, animateViewPosition],
  );

  const gestureHandlerWrapper = useCallback(
    (child: React.ReactNode) => (
      <PanGestureHandlerWithChildren
        waitFor={
          scrollViewRef as React.ComponentProps<
            typeof PanGestureHandler
          >['waitFor']
        }
        activeOffsetY={[0, 0]}
        activeOffsetX={[0, 0]}
        onGestureEvent={handleGesture}
      >
        {child}
      </PanGestureHandlerWithChildren>
    ),
    [handleGesture, scrollViewRef],
  );

  useEffect(() => {
    if (headerHeight !== 0 && wrapperHeight !== 0) {
      animateViewPosition(translationHeight, 0);
    }
  }, [headerHeight, wrapperHeight, translationHeight, animateViewPosition]);

  const isCollectionIconRenderable = Boolean(
    displayNftMedia ||
      (!displayNftMedia && isIpfsGatewayEnabled && isIPFSUri(collectible.logo)),
  );

  return gestureHandlerWrapper(
    <Animated.View
      onLayout={onWrapperLayout}
      style={[
        styles.wrapper,
        { transform: [{ translateY: positionAnimated }] },
      ]}
    >
      <View style={styles.titleWrapper}>
        <View style={styles.dragger} />
      </View>

      <SafeAreaView>
        <View onLayout={onHeaderLayout}>
          <View style={styles.generalContainer}>
            {!!collectible?.creator && (
              <View style={styles.userContainer}>
                {isCollectionIconRenderable && (
                  <RemoteImage
                    fadeIn
                    placeholderStyle={{
                      backgroundColor: colors.background.alternative,
                    }}
                    source={{ uri: collectible.logo ?? undefined }}
                    style={styles.userImage}
                  />
                )}
                <View
                  {...{ numberOfLines: 1 }}
                  style={styles.userInfoContainer}
                >
                  {(collectible.creator as OpenSeaCreator).user?.username && (
                    <Text black bold noMargin big={!IS_SMALL_DEVICE}>
                      {(collectible.creator as OpenSeaCreator).user?.username}
                    </Text>
                  )}
                  <Text numberOfLines={1} black noMargin small>
                    {collectible.contractName}
                  </Text>
                </View>
              </View>
            )}
            <Text numberOfLines={2} bold primary noMargin style={styles.name}>
              {collectible.name}
            </Text>
            <Text primary noMargin big>
              {strings('unit.token_id')}
              {renderShortText(collectible.tokenId, 8)}
            </Text>
          </View>

          <View style={[styles.generalContainer, styles.buttonContainer]}>
            {tradable && (
              <StyledButton
                onPressOut={onSend}
                type={'rounded-normal'}
                containerStyle={[
                  baseStyles.flexGrow,
                  styles.button,
                  styles.leftButton,
                ]}
              >
                <Text link big={!IS_SMALL_DEVICE} bold noMargin>
                  {strings('asset_overview.send_button')}
                </Text>
              </StyledButton>
            )}
            {collectible?.externalLink && (
              <StyledButton
                type={'rounded-normal'}
                containerStyle={[
                  styles.button,
                  styles.iconButtons,
                  styles.leftButton,
                ]}
                onPressOut={shareCollectible}
              >
                <Text bold link noMargin>
                  <EvilIcons
                    name={Device.isIos() ? 'share-apple' : 'share-google'}
                    size={32}
                  />
                </Text>
              </StyledButton>
            )}
            <StyledButton
              type={'rounded-normal'}
              containerStyle={[styles.button, styles.iconButtons]}
              onPressOut={collectibleToFavorites}
            >
              <Text link noMargin>
                <AntIcons name={isInFavorites ? 'star' : 'staro'} size={24} />
              </Text>
            </StyledButton>
          </View>
        </View>
        {collectible?.description ? (
          <View style={styles.information}>
            <View style={[styles.generalContainer, styles.row]}>
              <View>
                <Text noMargin black bold big={!IS_SMALL_DEVICE}>
                  {strings('collectible.collectible_description')}
                </Text>
              </View>

              {renderScrollableDescription ? (
                <ScrollView
                  ref={scrollViewRef}
                  bounces={false}
                  style={[styles.description, styles.scrollableDescription]}
                >
                  <TouchableWithoutFeedback>
                    <Text noMargin black style={styles.collectibleDescription}>
                      {collectible.description}
                    </Text>
                  </TouchableWithoutFeedback>
                </ScrollView>
              ) : (
                <View style={styles.description}>
                  <Text noMargin black style={styles.collectibleDescription}>
                    {collectible.description}
                  </Text>
                </View>
              )}
            </View>
          </View>
        ) : (
          <View />
        )}
        {<View style={styles.information}>{renderCollectibleInfo()}</View>}
      </SafeAreaView>
    </Animated.View>,
  );
};

const mapStateToProps = (
  state: RootState,
  props: { collectible: CollectibleData },
) => ({
  chainId: selectChainId(state),
  selectedAddress: selectSelectedInternalAccountFormattedAddress(state),
  isInFavorites: isCollectibleInFavoritesSelector(state, props.collectible),
});

const mapDispatchToProps = (
  dispatch: ThunkDispatch<RootState, unknown, AnyAction>,
) => ({
  addFavoriteCollectible: (
    selectedAddress: string | undefined,
    chainId: string | undefined,
    collectible: CollectibleData,
  ) =>
    dispatch(
      addFavoriteCollectibleAction(selectedAddress, chainId, collectible),
    ),
  removeFavoriteCollectible: (
    selectedAddress: string | undefined,
    chainId: string | undefined,
    collectible: CollectibleData,
  ) =>
    dispatch(
      removeFavoriteCollectibleAction(selectedAddress, chainId, collectible),
    ),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(
  Device.isIos()
    ? CollectibleOverview
    : gestureHandlerRootHOC(CollectibleOverview, {
        flex: 0,
        zIndex: 0,
        elevation: 0,
      }),
);
