/**
 * Shared React Native type utilities used across the MetaMask Mobile app.
 *
 * These types complement React Native's built-in types and provide
 * consistent patterns for common prop shapes.
 */
import type { ReactNode } from 'react';
import type {
  StyleProp,
  ViewStyle,
  TextStyle,
  ImageStyle,
  GestureResponderEvent,
  LayoutChangeEvent,
} from 'react-native';
import type {
  NavigationProp,
  RouteProp,
} from '@react-navigation/native';

/**
 * Common style prop types for components.
 */
export type ViewStyleProp = StyleProp<ViewStyle>;
export type TextStyleProp = StyleProp<TextStyle>;
export type ImageStyleProp = StyleProp<ImageStyle>;

/**
 * Standard callback types used by many components.
 */
export type OnPress = (event: GestureResponderEvent) => void;
export type OnLayout = (event: LayoutChangeEvent) => void;
export type VoidCallback = () => void;

/**
 * Common component prop patterns.
 */
export interface WithChildren {
  children?: ReactNode;
}

export interface WithStyle {
  style?: ViewStyleProp;
}

export interface WithTestId {
  testID?: string;
}

/**
 * Navigation prop helpers.
 * Use these with your screen-specific param list types.
 *
 * @example
 * interface AssetScreenProps {
 *   navigation: AppNavigationProp<RootStackParamList>;
 *   route: AppRouteProp<RootStackParamList, 'Asset'>;
 * }
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AppNavigationProp<ParamList extends Record<string, any>> =
  NavigationProp<ParamList>;

export type AppRouteProp<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ParamList extends Record<string, any>,
  RouteName extends keyof ParamList = keyof ParamList,
> = RouteProp<ParamList, RouteName>;
