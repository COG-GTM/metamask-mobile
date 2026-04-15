
import Logger from '../../util/Logger';
import AppConstants from '../AppConstants';



import Engine from '../../core/Engine';

import addDappConnection from './AndroidSDK/addDappConnection';
import bindAndroidSDK from './AndroidSDK/bindAndroidSDK';
import loadDappConnections from './AndroidSDK/loadDappConnections';

import {
  approveHost,
  connectToChannel,
  disapproveChannel,
  invalidateChannel,
  reconnect,
  reconnectAll,
  removeAll,
  removeChannel,
  watchConnection } from
'./ConnectionManagement';
import { init, postInit } from './InitializationManagement';
import RPCQueueManager from './RPCQueueManager';
import { DEFAULT_SESSION_TIMEOUT_MS } from './SDKConnectConstants';

import { pause, resume, unmount } from './SessionManagement';
import {
  handleAppState,
  hideLoadingState,
  updateOriginatorInfos,
  updateSDKLoadingState } from
'./StateManagement';
import DevLogger from './utils/DevLogger';






















































export class SDKConnect {


  state = {
    navigation: undefined,
    reconnected: false,
    _initialized: false,
    _initializing: undefined,
    _postInitialized: false,
    _postInitializing: false,
    timeout: undefined,
    initTimeout: undefined,
    paused: false,
    appState: undefined,
    connected: {},
    connections: {},
    dappConnections: {},
    androidSDKStarted: false,
    androidSDKBound: false,
    deeplinkingServiceStarted: false,
    androidService: undefined,
    deeplinkingService: undefined,
    connecting: {},
    approvedHosts: {},
    sdkLoadingState: {},
    disabledHosts: {},
    rpcqueueManager: new RPCQueueManager(),
    appStateListener: undefined,
    socketServerUrl: AppConstants.MM_SDK.SERVER_URL
  };

  SDKConnect() {

    // Keep empty to manage singleton
  }
  async connectToChannel({
    id,
    trigger,
    otherPublicKey,
    origin,
    protocolVersion,
    originatorInfo,
    initialConnection,
    validUntil = Date.now() + DEFAULT_SESSION_TIMEOUT_MS
  }) {
    return connectToChannel({
      id,
      trigger,
      otherPublicKey,
      protocolVersion,
      origin,
      originatorInfo,
      validUntil,
      initialConnection,
      instance: this
    });
  }

  watchConnection(connection) {
    return watchConnection(connection, this);
  }

  async updateSDKLoadingState({
    channelId,
    loading



  }) {
    return updateSDKLoadingState({ channelId, loading, instance: this });
  }

  async hideLoadingState() {
    return hideLoadingState({ instance: this });
  }

  updateOriginatorInfos({
    channelId,
    originatorInfo



  }) {
    return updateOriginatorInfos({ channelId, originatorInfo, instance: this });
  }

  async resume({ channelId }) {
    return resume({ channelId, instance: this });
  }

  async reconnect({
    channelId,
    otherPublicKey,
    initialConnection,
    protocolVersion,
    trigger,
    updateKey,
    context








  }) {
    return reconnect({
      channelId,
      otherPublicKey,
      context,
      protocolVersion,
      updateKey,
      trigger,
      initialConnection,
      instance: this
    });
  }

  async reconnectAll() {
    return reconnectAll(this);
  }

  setSDKSessions(sdkSessions) {
    this.state.connections = sdkSessions;
  }

  pause() {
    return pause(this);
  }

  async bindAndroidSDK() {
    return bindAndroidSDK(this);
  }

  isAndroidSDKBound() {
    return this.state.androidSDKBound;
  }

  async loadDappConnections()

  {
    return loadDappConnections();
  }

  getAndroidConnections() {
    return this.state.androidService?.getConnections();
  }

  async addDappConnection(connection) {
    return addDappConnection(connection, this);
  }

  async refreshChannel({ channelId }) {
    const session = this.state.connected[channelId];
    if (!session) {
      DevLogger.log(`SDKConnect::refreshChannel - session not found`);
      return;
    }
    DevLogger.log(`SDKConnect::refreshChannel channelId=${channelId}`);
    // Force enitting updated accounts
    session.backgroundBridge?.notifySelectedAddressChanged();
  }

  /**
   * Invalidate a channel/session by preventing future connection to be established.
   * Instead of removing the channel, it sets the session to timeout on next
   * connection which will remove it while conitnuing current session.
   *
   * @param channelId
   */
  invalidateChannel({ channelId }) {
    return invalidateChannel({ channelId, instance: this });
  }

  removeChannel({
    channelId,
    sendTerminate



  }) {
    return removeChannel({
      channelId,
      engine: Engine,
      sendTerminate,
      instance: this
    });
  }

  async removeAll() {
    const removeAllPromise = removeAll(this);
    // Force close loading status
    removeAllPromise.finally(() => this.hideLoadingState());
    return removeAllPromise;
  }

  getConnected() {
    return this.state.connected;
  }

  getConnections() {
    return this.state.connections;
  }

  getConnection({ channelId }) {
    return (
      this.state.connections[channelId] ?? this.state.dappConnections[channelId]);

  }

  getApprovedHosts(_context) {
    return this.state.approvedHosts || {};
  }

  disapproveChannel(channelId) {
    return disapproveChannel({ channelId, instance: this });
  }

  getSockerServerUrl() {
    return this.state.socketServerUrl;
  }

  async setSocketServerUrl(url) {
    try {
      this.state.socketServerUrl = url;

      await this.removeAll();
    } catch (err) {
      Logger.log(err, `SDKConnect::setSocketServerUrl - error `);
    }
  }

  revalidateChannel({ channelId }) {
    const hostname = AppConstants.MM_SDK.SDK_REMOTE_ORIGIN + channelId;

    this._approveHost({
      host: hostname,
      hostname,
      context: 'revalidateChannel'
    });
  }

  isApproved({ channelId }) {
    const hostname = AppConstants.MM_SDK.SDK_REMOTE_ORIGIN + channelId;
    const isApproved = this.state.approvedHosts[hostname] !== undefined;
    // possible future feature to add multiple approval parameters per channel.
    return isApproved;
  }

  _approveHost({ host }) {
    return approveHost({ host, instance: this });
  }

  async _handleAppState(appState) {
    return handleAppState({ appState, instance: this });
  }

  async unmount() {
    return unmount(this);
  }

  getSessionsStorage() {
    return this.state.connections;
  }

  async init({
    navigation,
    context



  }) {
    return init({ navigation, context, instance: this });
  }

  async postInit(callback) {
    return postInit(this, callback);
  }

  hasInitialized() {
    return this.state._initialized;
  }

  static getInstance() {
    if (!SDKConnect.instance) {
      SDKConnect.instance = new SDKConnect();
    }
    return SDKConnect.instance;
  }
}

export default SDKConnect;