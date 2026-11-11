import SDKConnect from '../SDKConnect';

/**
 * Whether a request's channelId belongs to an SDK connection (socket or
 * Android). Site metadata on these requests is self-reported by the app.
 */
export const isSDKChannel = (channelId?: string): boolean =>
  Boolean(channelId && SDKConnect.getInstance().getConnection({ channelId }));
