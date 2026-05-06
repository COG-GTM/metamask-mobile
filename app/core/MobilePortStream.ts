// eslint-disable-next-line import/no-nodejs-modules
import { Buffer } from 'buffer';
// eslint-disable-next-line import/no-nodejs-modules
import { Duplex } from 'stream';

interface PortLike {
  addListener(event: string, listener: (...args: unknown[]) => void): void;
  postMessage(msg: unknown, origin?: string): void;
}

interface BufferLikeMessage {
  _isBuffer?: boolean;
  [key: string]: unknown;
}

// eslint-disable-next-line no-empty-function
const noop = () => {
  // no-op
};

export default class PortDuplexStream extends Duplex {
  _port: PortLike;
  _url: string | undefined;

  constructor(port: PortLike, url?: string) {
    super({
      objectMode: true,
    });
    this._port = port;
    this._url = url;
    this._port.addListener('message', this._onMessage.bind(this) as (
      ...args: unknown[]
    ) => void);
    this._port.addListener('disconnect', this._onDisconnect.bind(this) as (
      ...args: unknown[]
    ) => void);
  }

  /**
   * Callback triggered when a message is received from
   * the remote Port associated with this Stream.
   *
   * @private
   * @param msg - Payload from the onMessage listener of Port
   */
  _onMessage = (msg: BufferLikeMessage | Buffer): void => {
    if (Buffer.isBuffer(msg)) {
      const mutableMsg = msg as Buffer & BufferLikeMessage;
      delete mutableMsg._isBuffer;
      const data = Buffer.from(msg);
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
  _onDisconnect = (): void => {
    this.destroy && this.destroy();
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
   * @param msg Arbitrary object to write
   * @param encoding Encoding to use when writing payload
   * @param cb Called when writing is complete or an error occurs
   */
  _write = (
    msg: BufferLikeMessage | Buffer,
    _encoding: string,
    cb: (err?: Error) => void,
  ): void => {
    try {
      if (Buffer.isBuffer(msg)) {
        const data = (msg as Buffer & {
          toJSON: () => BufferLikeMessage;
        }).toJSON() as BufferLikeMessage;
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
