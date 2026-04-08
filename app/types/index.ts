/**
 * Shared type definitions for the MetaMask Mobile app.
 *
 * Import from this barrel file for convenience:
 *   import { useAppSelector, useAppDispatch, ViewStyleProp } from '../types';
 */

// Redux typed hooks and utilities
export {
  useAppSelector,
  useAppDispatch,
  type AppDispatch,
} from './redux';

// React Native type utilities
export type {
  ViewStyleProp,
  TextStyleProp,
  ImageStyleProp,
  OnPress,
  OnLayout,
  VoidCallback,
  WithChildren,
  WithStyle,
  WithTestId,
  AppNavigationProp,
  AppRouteProp,
} from './react-native';
