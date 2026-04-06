/**
 * Common component prop type patterns used across the MetaMask Mobile app.
 *
 * These utility types help standardise prop definitions when migrating
 * components from PropTypes to TypeScript interfaces.
 */
import type { StyleProp, ViewStyle, TextStyle, ImageStyle } from 'react-native';

/**
 * Standard style prop — most components accept an optional container style.
 */
export interface WithStyle {
  style?: StyleProp<ViewStyle>;
}

/**
 * Standard text style prop.
 */
export interface WithTextStyle {
  textStyle?: StyleProp<TextStyle>;
}

/**
 * Standard image style prop.
 */
export interface WithImageStyle {
  imageStyle?: StyleProp<ImageStyle>;
}

/**
 * Components that accept a `testID` for E2E testing.
 */
export interface WithTestID {
  testID?: string;
}

/**
 * Components that accept children.
 */
export interface WithChildren {
  children?: React.ReactNode;
}

/**
 * Components that can be themed.
 */
export interface WithTheme {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  theme?: Record<string, any>;
}
