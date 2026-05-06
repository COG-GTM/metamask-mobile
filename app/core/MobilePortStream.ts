// eslint-disable-next-line import/no-nodejs-modules
import { Buffer } from 'buffer';
import { Duplex } from 'readable-stream';
// eslint-disable-next-line import/no-nodejs-modules
import type { EventEmitter } from 'events';

// eslint-disable-next-line no-empty-function
const noop = () => {};

interface PortLike extends EventEmitter {
  postMessage: (msg: unknown, url?: string) => void;
}

interface BufferLikeMessage {
  _isBuffer?: boolean;
  [key: string]: unknown;
}

export default class PortDuplexStream extends Duplex {
  _port: PortLike;
  _url: string;

  constructor(port: PortLike, url: string) {
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
   */
  _onMessage = function (this: PortDuplexStream, msg: unknown): void {
    if (Buffer.isBuffer(msg)) {
      // Strip our internal `_isBuffer` flag before re-wrapping the buffer.
      delete (msg as unknown as BufferLikeMessage)._isBuffer;
      const data = Buffer.from(msg as Uint8Array);
      this.push(data);
    } else {
      this.push(msg);
    }
  };

  /**
   * Callback triggered when the remote Port
   * associated with this Stream disconnects.
   */
  _onDisconnect = function (this: PortDuplexStream): void {
    this.destroy?.();
  };

  /**
   * Explicitly sets read operations to a no-op
   */
  _read = noop;

  /**
   * Called internally when data should be written to
   * this writable stream.
   */
  _write = function (
    this: PortDuplexStream,
    msg: unknown,
    _encoding: string,
    cb: (err?: Error) => void,
  ): void {
    try {
      if (Buffer.isBuffer(msg)) {
        const data = (msg as Buffer).toJSON() as unknown as BufferLikeMessage;
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
