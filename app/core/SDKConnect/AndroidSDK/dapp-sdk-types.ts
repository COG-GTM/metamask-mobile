import { OriginatorInfo } from '@metamask/sdk-communication-layer';

export interface DappClient {
  originatorInfo: OriginatorInfo;
  clientId: string;
  connected: boolean;
  validUntil?: number;
  scheme?: string;
  // Android package bound to this session by the native layer
  callerPackage?: string;
}

export interface DappConnections {
  [clientId: string]: DappClient;
}
