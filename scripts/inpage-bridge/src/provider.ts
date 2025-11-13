import { initializeProvider, shimWeb3 } from '@metamask/providers';
import ObjectMultiplex from '@metamask/object-multiplex';
import pump from 'pump';
import { v4 as uuid } from 'uuid';
import MobilePortStream from './MobilePortStream';
import ReactNativePostMessageStream from './ReactNativePostMessageStream';

const INPAGE = 'metamask-inpage';
const CONTENT_SCRIPT = 'metamask-contentscript';
const PROVIDER = 'metamask-provider';

const metamaskStream = new ReactNativePostMessageStream({
  name: INPAGE,
  target: CONTENT_SCRIPT,
});

declare global {
  interface Window {
    _metamaskSetupProvider?: () => void;
    ethereum?: unknown;
  }
}

const init = (): void => {
  initializeProvider({
    connectionStream: metamaskStream,
    shouldSendMetadata: false,
    providerInfo: {
      uuid: uuid(),
      name: process.env.METAMASK_BUILD_NAME,
      icon: process.env.METAMASK_BUILD_ICON,
      rdns: process.env.METAMASK_BUILD_APP_ID,
    },
  });

  Object.defineProperty(window, '_metamaskSetupProvider', {
    value: () => {
      setupProviderStreams();
      delete window._metamaskSetupProvider;
    },
    configurable: true,
    enumerable: false,
    writable: false,
  });

};


/**
 * Setup function called from content script after the DOM is ready.
 */
function setupProviderStreams(): void {
  const pageStream = new ReactNativePostMessageStream({
    name: CONTENT_SCRIPT,
    target: INPAGE,
  });

  const appStream = new MobilePortStream({
    name: CONTENT_SCRIPT,
  });

  const pageMux = new ObjectMultiplex();
  pageMux.setMaxListeners(25);
  const appMux = new ObjectMultiplex();
  appMux.setMaxListeners(25);

  pump(pageMux, pageStream, pageMux, (err?: Error) =>
    logStreamDisconnectWarning('MetaMask Inpage Multiplex', err),
  );
  pump(appMux, appStream, appMux, (err?: Error) => {
    logStreamDisconnectWarning('MetaMask Background Multiplex', err);
    notifyProviderOfStreamFailure();
  });

  forwardTrafficBetweenMuxes(PROVIDER, pageMux, appMux);

  shimWeb3(window.ethereum);
}

/**
 * Set up two-way communication between muxes for a single, named channel.
 *
 * @param channelName - The name of the channel.
 * @param muxA - The first mux.
 * @param muxB - The second mux.
 */
function forwardTrafficBetweenMuxes(channelName: string, muxA: ObjectMultiplex, muxB: ObjectMultiplex): void {
  const channelA = muxA.createStream(channelName);
  const channelB = muxB.createStream(channelName);
  pump(channelA, channelB, channelA, (err?: Error) =>
    logStreamDisconnectWarning(
      `MetaMask muxed traffic for channel "${channelName}" failed.`,
      err,
    ),
  );
}

/**
 * Error handler for page to extension stream disconnections
 *
 * @param remoteLabel - Remote stream name
 * @param err - Stream connection error
 */
function logStreamDisconnectWarning(remoteLabel: string, err?: Error): void {
  let warningMsg = `MetamaskContentscript - lost connection to ${remoteLabel}`;
  if (err) {
    warningMsg += `\n${err.stack}`;
  }
  console.warn(warningMsg);
  console.error(err);
}

/**
 * This function must ONLY be called in pump destruction/close callbacks.
 * Notifies the inpage context that streams have failed, via window.postMessage.
 * Relies on @metamask/object-multiplex and post-message-stream implementation details.
 */
function notifyProviderOfStreamFailure(): void {
  window.postMessage(
    {
      target: INPAGE, // the post-message-stream "target"
      data: {
        name: PROVIDER, // the object-multiplex channel name
        data: {
          jsonrpc: '2.0',
          method: 'METAMASK_STREAM_FAILURE',
        },
      },
    },
    window.location.origin,
  );
}

export default init;
