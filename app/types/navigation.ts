/**
 * Centralized navigation type definitions for the MetaMask Mobile app.
 *
 * These types should be used alongside React Navigation's typed patterns
 * to ensure type-safe navigation throughout the app.
 *
 * Usage:
 *   import type { RootStackParamList } from '../types/navigation';
 *   import type { StackScreenProps } from '@react-navigation/stack';
 *
 *   type Props = StackScreenProps<RootStackParamList, 'WalletView'>;
 */
import type { NavigatorScreenParams } from '@react-navigation/native';

/**
 * Root-level stack navigator param list.
 *
 * Each key corresponds to a screen name and its value is the params object
 * that screen expects (or `undefined` if it takes no params).
 *
 * NOTE: This is a starter definition. As screens are migrated to TypeScript,
 * add their specific param types here. Use `undefined` for screens that do
 * not accept any params.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface RootStackParamList {
  [key: string]: undefined | Record<string, unknown>;
}

/**
 * Onboarding navigator param list.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface OnboardingStackParamList {
  [key: string]: undefined | Record<string, unknown>;
}

/**
 * Modal navigator param list.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ModalStackParamList {
  [key: string]: undefined | Record<string, unknown>;
}

/**
 * Wallet tab navigator param list.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface WalletTabParamList {
  [key: string]: undefined | Record<string, unknown>;
}

/**
 * Browser tab navigator param list.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface BrowserTabParamList {
  [key: string]: undefined | Record<string, unknown>;
}

/**
 * Helper type for typing `navigation` and `route` props in screen components.
 *
 * Usage:
 *   import type { ScreenProps } from '../types/navigation';
 *   import type { StackScreenProps } from '@react-navigation/stack';
 *
 *   type WalletViewProps = StackScreenProps<RootStackParamList, 'WalletView'>;
 *
 *   const WalletView: React.FC<WalletViewProps> = ({ navigation, route }) => { ... };
 */
export type { NavigatorScreenParams };
