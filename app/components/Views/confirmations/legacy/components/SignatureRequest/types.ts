import { SecurityAlertResponse } from '../BlockaidBanner/BlockaidBanner.types';

export interface MessageInfo {
  origin: string;
  type: string;
}

export interface PageMeta {
  analytics?: {
    request_platform: string;
    request_source: string;
  };
  icon?: string;
  title: string;
  url: string;
}

interface TypedSignV1DataItem {
  name: string;
  value: string;
  type?: string;
}

export interface MessageParams {
  data: string | TypedSignV1DataItem[] | Record<string, unknown>;
  from: string;
  metamaskId: string;
  meta?: PageMeta;
  origin: string;
  version?: 'V1' | 'V3' | 'V4' | string;
  securityAlertResponse?: SecurityAlertResponse;
}
