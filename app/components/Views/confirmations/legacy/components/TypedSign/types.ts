import { PageMeta } from '../SignatureRequest/types';
import { SecurityAlertResponse } from '../BlockaidBanner/BlockaidBanner.types';

export interface TypedSignMessageParams {
  from: string;
  metamaskId: string;
  origin: string;
  version: 'V1' | 'V3' | 'V4';
  data: string | TypedDataV1[];
  meta?: PageMeta;
  securityAlertResponse?: SecurityAlertResponse;
}

export interface TypedDataV1 {
  name: string;
  value: string;
}

export interface TypedSignProps {
  onReject: () => void;
  onConfirm: () => void;
  messageParams: TypedSignMessageParams;
  currentPageInformation: PageMeta;
  toggleExpandedMessage?: () => void;
  showExpandedMessage?: boolean;
  securityAlertResponse?: SecurityAlertResponse;
  networkType?: string;
}
