// eslint-disable-next-line import/no-nodejs-modules
import { Buffer } from 'buffer';
// @ts-expect-error readable-stream does not ship declarations.
import { Duplex } from 'readable-stream';

// eslint-disable-next-line no-empty-function
const noop = () => {};

interface Port {
  addListener(event: string, listener: (message: unknown) => void): void;
  postMessage(message: unknown, url: string): void;
}

interface BufferWithMarker extends Buffer {
  _isBuffer?: boolean;
}

interface SerializedBuffer {
  type: 'Buffer';
  data: number[];
  _isBuffer?: boolean;
}

export default class PortDuplexStream extends Duplex {
  private _port: Port;

  private _url: string;

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
  _onMessage = function (
    this: PortDuplexStream,
    msg: unknown,
  ): void {
    if (Buffer.isBuffer(msg)) {
      delete (msg as BufferWithMarker)._isBuffer;
      const data = new Buffer(msg);
      (this as unknown as { push(chunk: unknown): boolean }).push(data);
    } else {
      (this as unknown as { push(chunk: unknown): boolean }).push(msg);
    }
  };

  /**
   * Callback triggered when the remote Port
   * associated with this Stream disconnects.
   *
   * @private
   */
  _onDisconnect = function (this: PortDuplexStream): void {
    const stream = this as unknown as {
      destroy?: () => PortDuplexStream;
    };
    stream.destroy && stream.destroy();
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
    msg: unknown,
    _encoding: string,
    cb: (error?: Error | null) => void,
  ): void {
    try {
      if (Buffer.isBuffer(msg)) {
        const data = msg.toJSON();
        (data as SerializedBuffer)._isBuffer = true;
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
