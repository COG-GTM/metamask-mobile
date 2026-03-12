// eslint-disable-next-line import/no-nodejs-modules
import { Buffer } from 'buffer';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { Duplex } = require('readable-stream');

// eslint-disable-next-line no-empty-function
const noop = () => {};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default class PortDuplexStream extends (Duplex as any) {
  _port: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  _url: string;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(port: any, url: string) {
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _onMessage = function (this: PortDuplexStream, msg: any) {
    if (Buffer.isBuffer(msg)) {
      delete (msg as any)._isBuffer; // eslint-disable-line @typescript-eslint/no-explicit-any
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
  _onDisconnect = function (this: PortDuplexStream) {
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
   * @param {*} msg Arbitrary object to write
   * @param {string} encoding Encoding to use when writing payload
   * @param {Function} cb Called when writing is complete or an error occurs
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _write = function (this: PortDuplexStream, msg: any, encoding: string, cb: (error?: Error) => void) {
    try {
      if (Buffer.isBuffer(msg)) {
        const data: any = msg.toJSON(); // eslint-disable-line @typescript-eslint/no-explicit-any
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
