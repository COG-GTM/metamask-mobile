import { SecurityAlertResponse } from '../BlockaidBanner/BlockaidBanner.types';

export interface MessageInfo {
  origin: string;
  type: string;
}

// Type alias (not interface) so it is assignable to the index-signature based
// `SignaturePageInformation` shared with the signature utils.
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type PageMeta = {
  analytics?: {
    request_platform: string;
    request_source: string;
  };
  icon?: string;
  title: string;
  url: string;
};

export interface MessageParams {
  data: string;
  from: string;
  metamaskId: string;
  meta?: PageMeta;
  origin: string;
  version?: string;
  securityAlertResponse?: SecurityAlertResponse;
}
