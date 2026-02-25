// eslint-disable-next-line import/no-nodejs-modules
import { Buffer } from 'buffer';
import { Duplex } from 'readable-stream';

// eslint-disable-next-line no-empty-function
const noop = () => {};

export default class PortDuplexStream extends Duplex {
  _port: { addListener: (event: string, cb: (...args: unknown[]) => void) => void; postMessage: (msg: unknown, url: string) => void };
  _url: string;

  constructor(port: { addListener: (event: string, cb: (...args: unknown[]) => void) => void; postMessage: (msg: unknown, url: string) => void }, url: string) {
    super({
      objectMode: true,
    });
    this._port = port;
    this._url = url;
    this._port.addListener('message', this._onMessage.bind(this) as (...args: unknown[]) => void);
    this._port.addListener('disconnect', this._onDisconnect.bind(this) as (...args: unknown[]) => void);
  }

  /**
   * Callback triggered when a message is received from
   * the remote Port associated with this Stream.
   *
   * @private
   * @param {Object} msg - Payload from the onMessage listener of Port
   */
  _onMessage(msg: Record<string, unknown> & { _isBuffer?: boolean }) {
    if (Buffer.isBuffer(msg)) {
      delete msg._isBuffer;
      const data = Buffer.from(msg as unknown as ArrayBuffer);
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
  _onDisconnect() {
    this.destroy && this.destroy();
  }

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
  _write(msg: Record<string, unknown>, encoding: string, cb: (error?: Error | null) => void) {
    try {
      if (Buffer.isBuffer(msg)) {
        const data = msg.toJSON();
        (data as Record<string, unknown>)._isBuffer = true;
        this._port.postMessage(data, this._url);
      } else {
        this._port.postMessage(msg, this._url);
      }
    } catch (err) {
      return cb(new Error('PortDuplexStream - disconnected'));
    }
    cb();
  }
}
