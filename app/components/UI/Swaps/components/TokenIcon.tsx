import React, { useCallback, useState } from 'react';
import {
  ImageSourcePropType,
  StyleProp,
  StyleSheet,
  TextStyle,
  View,
  ViewProps,
  ViewStyle,
} from 'react-native';
import { Theme } from '@metamask/design-tokens';

import RemoteImage from '../../../Base/RemoteImage';
import Text from '../../../Base/Text';
import { useTheme } from '../../../../util/theme';
import imageIcons from '../../../../images/image-icons';

import ethLogo from '../../../../images/eth-logo-new.png';

const REGULAR_SIZE = 24;
const REGULAR_RADIUS = 12;
const MEDIUM_SIZE = 36;
const MEDIUM_RADIUS = 18;
const BIG_SIZE = 50;
const BIG_RADIUS = 25;
const BIGGEST_SIZE = 70;
const BIGGEST_RADIUS = 35;

const createStyles = (colors: Theme['colors']) =>
  StyleSheet.create({
    icon: {
      width: REGULAR_SIZE,
      height: REGULAR_SIZE,
      borderRadius: REGULAR_RADIUS,
    },
    iconMedium: {
      width: MEDIUM_SIZE,
      height: MEDIUM_SIZE,
      borderRadius: MEDIUM_RADIUS,
    },
    iconBig: {
      width: BIG_SIZE,
      height: BIG_SIZE,
      borderRadius: BIG_RADIUS,
    },
    iconBiggest: {
      width: BIGGEST_SIZE,
      height: BIGGEST_SIZE,
      borderRadius: BIGGEST_RADIUS,
    },
    emptyIcon: {
      backgroundColor: colors.background.alternative,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tokenSymbol: {
      fontSize: 16,
      textAlign: 'center',
      textAlignVertical: 'center',
      color: colors.text.default,
    },
    tokenSymbolMedium: {
      fontSize: 22,
      color: colors.text.default,
    },
    tokenSymbolBig: {
      fontSize: 26,
      color: colors.text.default,
    },
  });

interface EmptyIconProps extends ViewProps {
  medium?: boolean;
  big?: boolean;
  biggest?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const EmptyIcon = ({
  medium,
  big,
  biggest,
  style,
  ...props
}: EmptyIconProps) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View
      style={[
        styles.icon,
        medium && styles.iconMedium,
        big && styles.iconBig,
        biggest && styles.iconBiggest,
        styles.emptyIcon,
        style,
      ]}
      {...props}
    />
  );
};

const isImageIconSymbol = (
  value: string,
): value is keyof typeof imageIcons =>
  Object.keys(imageIcons).includes(value);

export interface TokenIconProps {
  symbol?: string;
  icon?: string;
  medium?: boolean;
  big?: boolean;
  biggest?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

function TokenIcon({
  symbol,
  icon,
  medium,
  big,
  biggest,
  style,
  testID,
}: TokenIconProps) {
  const [showFallback, setShowFallback] = useState(false);
  const { colors } = useTheme();
  // `tokenSymbolBiggest` is not part of the stylesheet, so it resolves to undefined.
  const styles: ReturnType<typeof createStyles> & {
    tokenSymbolBiggest?: TextStyle;
  } = createStyles(colors);

  const getSource = useCallback((): ImageSourcePropType | null => {
    if (symbol === 'ETH') {
      return ethLogo;
    }

    if (symbol === 'SOL') {
      return imageIcons.SOLANA;
    }

    if (symbol && isImageIconSymbol(symbol)) {
      return imageIcons[symbol];
    }

    if (icon) {
      return { uri: icon };
    }

    return null;
  }, [symbol, icon]);
  const source = getSource();

  if (source && !showFallback) {
    return (
      <RemoteImage
        testID={testID}
        fadeIn
        source={source}
        onError={() => setShowFallback(true)}
        style={[
          styles.icon,
          medium && styles.iconMedium,
          big && styles.iconBig,
          biggest && styles.iconBiggest,
          style,
        ]}
      />
    );
  }

  if (symbol) {
    return (
      <EmptyIcon
        medium={medium}
        big={big}
        biggest={biggest}
        style={style}
        testID={testID}
      >
        <Text
          style={[
            styles.tokenSymbol,
            medium && styles.tokenSymbolMedium,
            (big || biggest) && styles.tokenSymbolBig,
            biggest && styles.tokenSymbolBiggest,
          ]}
        >
          {symbol[0].toUpperCase()}
        </Text>
      </EmptyIcon>
    );
  }

  return <EmptyIcon medium={medium} style={style} />;
}

export default TokenIcon;
