import { ReactNode } from 'react';
import { PageMeta } from '../SignatureRequest/types';
import { SecurityAlertResponse } from '../BlockaidBanner/BlockaidBanner.types';
import { IUseMetricsHook } from '../../../../../hooks/useMetrics/useMetrics.types';

/**
 * V1 typed data item structure
 */
export interface TypedDataV1Item {
  name: string;
  value: string;
  type?: string;
}

/**
 * Message params for typed sign
 */
export interface TypedSignMessageParams {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
  from: string;
  metamaskId: string;
  meta?: PageMeta;
  origin: string;
  version?: string;
  securityAlertResponse?: SecurityAlertResponse;
  [key: string]: unknown;
}

/**
 * Navigation interface for TypedSign component
 */
export interface TypedSignNavigation {
  navigate: (...args: [string, object?]) => void;
}

/**
 * Props for the TypedSign component
 */
export interface TypedSignProps {
  /**
   * react-navigation object used for switching between screens
   */
  navigation?: TypedSignNavigation;
  /**
   * Callback triggered when this message signature is rejected
   */
  onReject?: () => void;
  /**
   * Callback triggered when this message signature is approved
   */
  onConfirm?: () => void;
  /**
   * Typed message to be displayed to the user
   */
  messageParams: TypedSignMessageParams;
  /**
   * Object containing current page title and url
   */
  currentPageInformation?: PageMeta;
  /**
   * Hides or shows the expanded signing message
   */
  toggleExpandedMessage?: () => void;
  /**
   * Indicated whether or not the expanded message is shown
   */
  showExpandedMessage?: boolean;
  /**
   * Security alert response object
   */
  securityAlertResponse?: SecurityAlertResponse;
  /**
   * Metrics injected by withMetricsAwareness HOC
   */
  metrics?: IUseMetricsHook;
  /**
   * String representing the associated network
   */
  networkType?: string;
  /**
   * Children elements
   */
  children?: ReactNode;
}

/**
 * State for the TypedSign component
 */
export interface TypedSignState {
  truncateMessage: boolean;
}
