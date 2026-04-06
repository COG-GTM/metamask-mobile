/**
 * Centralized type exports for the MetaMask Mobile app.
 *
 * Import shared types from here:
 *   import { useAppSelector, useAppDispatch, AppDispatch } from '../types';
 *   import type { RootStackParamList, WithTestID } from '../types';
 */

// Redux typed hooks & types
export { useAppSelector, useAppDispatch } from './redux';
export type { AppDispatch } from './redux';

// Navigation param lists
export type {
  RootStackParamList,
  OnboardingStackParamList,
  ModalStackParamList,
  WalletTabParamList,
  BrowserTabParamList,
} from './navigation';

// Common component prop patterns
export type {
  WithStyle,
  WithTextStyle,
  WithImageStyle,
  WithTestID,
  WithChildren,
  WithTheme,
} from './component-props';
