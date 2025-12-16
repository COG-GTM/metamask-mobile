import React, { useCallback, useState } from 'react';
import { StyleSheet, View, StyleProp, ViewStyle, ImageStyle, TextStyle } from 'react-native';

import RemoteImage from '../../../Base/RemoteImage';
import Text from '../../../Base/Text';
import { useTheme } from '../../../../util/theme';
import imageIcons from '../../../../images/image-icons';
import { Theme } from '../../../../util/theme/models';

/* eslint-disable import/no-commonjs */
const ethLogo = require('../../../../images/eth-logo-new.png');
/* eslint-enable import/no-commonjs */

const REGULAR_SIZE = 24;
const REGULAR_RADIUS = 12;
const MEDIUM_SIZE = 36;
const MEDIUM_RADIUS = 18;
const BIG_SIZE = 50;
const BIG_RADIUS = 25;
const BIGGEST_SIZE = 70;
const BIGGEST_RADIUS = 35;

interface Styles {
  icon: ImageStyle;
  iconMedium: ImageStyle;
  iconBig: ImageStyle;
  iconBiggest: ImageStyle;
  emptyIcon: ViewStyle;
  tokenSymbol: TextStyle;
  tokenSymbolMedium: TextStyle;
  tokenSymbolBig: TextStyle;
}

const createStyles = (colors: Theme['colors']): Styles =>
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

interface EmptyIconProps {
  medium?: boolean;
  big?: boolean;
  biggest?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  children?: React.ReactNode;
}

const EmptyIcon: React.FC<EmptyIconProps> = ({ medium, big, biggest, style, children, ...props }) => {
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
    >
      {children}
    </View>
  );
};

interface TokenIconProps {
  symbol?: string;
  icon?: string;
  medium?: boolean;
  big?: boolean;
  biggest?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

function TokenIcon({ symbol, icon, medium, big, biggest, style, testID }: TokenIconProps) {
  const [showFallback, setShowFallback] = useState(false);
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const getSource = useCallback(() => {
    if (symbol === 'ETH') {
      return ethLogo;
    }

    if (symbol === 'SOL') {
      return imageIcons.SOLANA;
    }

    if (symbol && Object.keys(imageIcons).includes(symbol)) {
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
        source={getSource()}
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
