import { Duplex } from 'readable-stream';

const noop = (): undefined => undefined;

interface MobilePortStreamOptions {
  name: string;
}

interface MessageData {
  target?: string;
  data?: {
    data?: {
      toNative?: boolean;
    };
    toNative?: boolean;
  };
  _isBuffer?: boolean;
}

interface ReactNativeWebView {
  postMessage: (message: string) => void;
}

declare global {
  interface Window {
    ReactNativeWebView: ReactNativeWebView;
  }
}

/**
 * Creates a stream that's both readable and writable.
 * The stream supports arbitrary objects.
 *
 * @class
 * @param port Remote Port object
 */
class MobilePortStream extends Duplex {
  private _name: string;
  private _targetWindow: Window;
  private _port: MobilePortStreamOptions;
  private _origin: string;

  constructor(port: MobilePortStreamOptions) {
    super({
      objectMode: true,
    });
    this._name = port.name;
    this._targetWindow = window;
    this._port = port;
    this._origin = location.origin;
    window.addEventListener('message', this._onMessage.bind(this), false);
  }

  /**
   * Callback triggered when a message is received from
   * the remote Port associated with this Stream.
   *
   * @private
   * @param event - Message event from the window
   */
  private _onMessage(event: MessageEvent): void {
    const msg = event.data as MessageData;

    if (this._origin !== '*' && event.origin !== this._origin) {
      return;
    }
    if (!msg || typeof msg !== 'object') {
      return;
    }
    if (!msg.data || typeof msg.data !== 'object') {
      return;
    }
    if (msg.target && msg.target !== this._name) {
      return;
    }
    if (msg.data.data && msg.data.data.toNative) {
      return;
    }

    if (Buffer.isBuffer(msg)) {
      delete msg._isBuffer;
      const data = Buffer.from(msg as Buffer);
      this.push(data);
    } else {
      this.push(msg);
    }
  }

  /**
   * Callback triggered when the remote Port
   * associated with this Stream disconnects.
   *
   * @private
   */
  private _onDisconnect(): void {
    this.destroy();
  }

  /**
   * Explicitly sets read operations to a no-op
   */
  _read(): void {
    noop();
  }

  /**
   * Called internally when data should be written to
   * this writable stream.
   *
   * @private
   * @param msg Arbitrary object to write
   * @param _encoding Encoding to use when writing payload
   * @param cb Called when writing is complete or an error occurs
   */
  _write(msg: unknown, _encoding: BufferEncoding, cb: (error?: Error | null) => void): void {
    try {
      if (Buffer.isBuffer(msg)) {
        const data = msg.toJSON();
        (data as Record<string, unknown>)._isBuffer = true;
        window.ReactNativeWebView.postMessage(
          JSON.stringify({ ...data, origin: window.location.href }),
        );
      } else {
        const msgData = msg as MessageData;
        if (msgData.data) {
          msgData.data.toNative = true;
        }
        window.ReactNativeWebView.postMessage(
          JSON.stringify({ ...msgData, origin: window.location.href }),
        );
      }
    } catch (err) {
      return cb(new Error('MobilePortStream - disconnected'));
    }
    return cb();
  }
}

export = MobilePortStream;
