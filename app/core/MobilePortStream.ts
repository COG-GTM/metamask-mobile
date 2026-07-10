// eslint-disable-next-line import/no-nodejs-modules
import { Buffer } from 'buffer';
// eslint-disable-next-line import/no-nodejs-modules
import { Duplex } from 'stream';

// eslint-disable-next-line no-empty-function
const noop = () => {};

/**
 * Interface for the port that this stream communicates with.
 * Implemented by Port, RemotePort and WalletConnectPort.
 */
interface PortInterface {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addListener(event: string, listener: (...args: any[]) => void): void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  postMessage(msg: any, url?: string): void;
}

export default class PortDuplexStream extends Duplex {
  private _port: PortInterface;

  private _url: string;

  constructor(port: PortInterface, url: string) {
    super({
      objectMode: true,
    });
    this._port = port;
    this._url = url;
    this._port.addListener('message', this._onMessage.bind(this));
    this._port.addListener('disconnect', this._onDisconnect.bind(this));
  }

  /**
   * Callback triggered when a message is received from
   * the remote Port associated with this Stream.
   *
   * @private
   * @param msg - Payload from the onMessage listener of Port
   */
  _onMessage = function (this: PortDuplexStream, msg: unknown) {
    if (Buffer.isBuffer(msg)) {
      delete (msg as Buffer & { _isBuffer?: boolean })._isBuffer;
      const data = new Buffer(msg);
      this.push(data);
    } else {
      this.push(msg);
    }
  };

  /**
   * Callback triggered when the remote Port
   * associated with this Stream disconnects.
   *
   * @private
   */
  _onDisconnect = function (this: PortDuplexStream) {
    this.destroy?.();
  };

  /**
   * Explicitly sets read operations to a no-op
   */
  _read = noop;

  /**
   * Called internally when data should be written to
   * this writable stream.
   *
   * @private
   * @param msg - Arbitrary object to write
   * @param encoding - Encoding to use when writing payload
   * @param cb - Called when writing is complete or an error occurs
   */
  _write = function (
    this: PortDuplexStream,
    msg: unknown,
    _encoding: string,
    cb: (error?: Error | null) => void,
  ) {
    try {
      if (Buffer.isBuffer(msg)) {
        const data: Record<string, unknown> = msg.toJSON();
        data._isBuffer = true;
        this._port.postMessage(data, this._url);
      } else {
        this._port.postMessage(msg, this._url);
      }
    } catch (err) {
      return cb(new Error('PortDuplexStream - disconnected'));
    }
    cb();
  };
}
