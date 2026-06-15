import { CommunicationLayerMessage } from '@metamask/sdk-communication-layer';

/**
 * Payload carried inside an SDK provider message (`msg.data`). It mirrors a
 * JSON-RPC request/response object exchanged with the dapp.
 */
export interface SDKRpcMessageData {
  id?: string | number;
  jsonrpc?: string;
  method?: string;
  params?: unknown;
  result?: unknown;
  error?: unknown;
}

/**
 * Message exchanged between the BackgroundBridge and the SDK transport layer.
 * It is structurally compatible with {@link CommunicationLayerMessage} so it
 * can be forwarded to the remote communication channel.
 */
export interface SDKMessage extends Omit<CommunicationLayerMessage, 'data'> {
  data?: SDKRpcMessageData;
}
