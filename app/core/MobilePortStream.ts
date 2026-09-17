/* eslint-disable import/no-commonjs */
// eslint-disable-next-line import/no-nodejs-modules
import { Buffer } from 'buffer';
// eslint-disable-next-line import/no-nodejs-modules
import type { Duplex as NodeDuplex } from 'stream';

// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
const { Duplex } = require('readable-stream') as { Duplex: typeof NodeDuplex };

/**
 * Interface for the Port object that this Duplex stream wraps.
 */
interface Port {
  addListener(
    event: string,
    listener: (...args: unknown[]) => void,
  ): void;
  postMessage(message: unknown, origin?: string): void;
}

// eslint-disable-next-line no-empty-function
const noop = () => {
  /* no-op */
};

export default class PortDuplexStream extends Duplex {
  _port: Port;
  _url?: string;

  constructor(port: Port, url?: string) {
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
   * @param msg - Payload from the onMessage listener of Port
   */
  _onMessage = (msg: unknown) => {
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
   */
  _onDisconnect = () => {
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
   * @param msg - Arbitrary object to write
   * @param encoding - Encoding to use when writing payload
   * @param cb - Called when writing is complete or an error occurs
   */
  _write = (
    msg: unknown,
    _encoding: BufferEncoding,
    cb: (error?: Error | null) => void,
  ) => {
    try {
      if (Buffer.isBuffer(msg)) {
        const data: { _isBuffer?: boolean } & ReturnType<Buffer['toJSON']> =
          msg.toJSON();
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
