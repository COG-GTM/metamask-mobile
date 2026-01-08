import { PageMeta } from '../SignatureRequest/types';

/**
 * PersonalSign-specific message params where data is always a string (hex-encoded message)
 */
export interface PersonalSignMessageParams {
  data: string;
  from: string;
  metamaskId: string;
  meta?: PageMeta;
  origin: string;
}

export interface PersonalSignProps {
  /**
   * Callback triggered when this message signature is rejected
   */
  onReject: () => void;
  /**
   * Callback triggered when this message signature is approved
   */
  onConfirm: () => void;
  /**
   * Personal message to be displayed to the user
   */
  messageParams: PersonalSignMessageParams;
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
}
