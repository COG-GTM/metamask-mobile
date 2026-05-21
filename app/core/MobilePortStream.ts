// eslint-disable-next-line import/no-nodejs-modules
import { Buffer } from 'buffer';

// readable-stream v2 has no type declarations
// eslint-disable-next-line @typescript-eslint/no-var-requires, import/no-commonjs
const { Duplex } = require('readable-stream');

// eslint-disable-next-line no-empty-function
const noop = () => {};

interface Port {
  addListener(event: string, listener: (...args: never[]) => void): void;
  postMessage(msg: unknown, url: string): void;
  emit(event: string, ...args: unknown[]): void;
  name?: string;
}

interface BufferMessage {
  _isBuffer?: boolean;
  [key: string]: unknown;
}

export default class PortDuplexStream extends Duplex {
  _port: Port;
  _url: string;

  constructor(port: Port, url: string) {
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
   * @param {Object} msg - Payload from the onMessage listener of Port
   */
  _onMessage = function (this: PortDuplexStream, msg: BufferMessage) {
    if (Buffer.isBuffer(msg)) {
      delete msg._isBuffer;
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
   * @param {*} msg Arbitrary object to write
   * @param {string} encoding Encoding to use when writing payload
   * @param {Function} cb Called when writing is complete or an error occurs
   */
  _write = function (
    this: PortDuplexStream,
    msg: BufferMessage,
    _encoding: string,
    cb: (error?: Error | null) => void,
  ) {
    try {
      if (Buffer.isBuffer(msg)) {
        const data: BufferMessage = (msg as Buffer).toJSON() as BufferMessage;
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
