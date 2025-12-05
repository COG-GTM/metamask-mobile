import { MessageParams, PageMeta } from '../SignatureRequest/types';
import { SecurityAlertResponse } from '../BlockaidBanner/BlockaidBanner.types';

export interface TypedSignProps {
  /**
   * react-navigation object used for switching between screens
   */
  navigation: {
    navigate: (...args: unknown[]) => void;
  };
  /**
   * Callback triggered when this message signature is rejected
   */
  onReject: () => Promise<void> | void;
  /**
   * Callback triggered when this message signature is approved
   */
  onConfirm: () => Promise<void> | void;
  /**
   * Typed message to be displayed to the user
   */
  messageParams: TypedMessageParams;
  /**
   * Object containing current page title and url
   */
  currentPageInformation: PageMeta;
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
  metrics: {
    trackEvent: (event: unknown) => void;
  };
  /**
   * String representing the associated network
   */
  networkType?: string;
}

export interface TypedMessageParams extends MessageParams {
  version: 'V1' | 'V3' | 'V4';
}

export interface TypedSignState {
  truncateMessage: boolean;
}

export interface TypedDataV1Item {
  name: string;
  value: string;
}
