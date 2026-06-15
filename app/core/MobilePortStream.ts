// eslint-disable-next-line import/no-nodejs-modules
import { Buffer } from 'buffer';
import { Duplex } from 'readable-stream';

// eslint-disable-next-line no-empty-function
const noop = () => undefined;

/**
 * Minimal interface for the Port-like objects that drive a {@link PortDuplexStream}.
 */
interface MobilePortStreamPort {
  addListener(event: string, listener: (...args: unknown[]) => void): void;
  postMessage(msg: unknown, origin?: string): void;
}

interface BufferJSON {
  type: 'Buffer';
  data: number[];
  _isBuffer?: boolean;
}

export default class PortDuplexStream extends Duplex {
  _port: MobilePortStreamPort;
  _url?: string;

  constructor(port: MobilePortStreamPort, url?: string) {
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
      const data = Buffer.from(msg);
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
    this.destroy();
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
   * @param _encoding - Encoding to use when writing payload
   * @param cb - Called when writing is complete or an error occurs
   */
  _write = (
    msg: Buffer | Record<string, unknown>,
    _encoding: string,
    cb: (error?: Error | null) => void,
  ) => {
    try {
      if (Buffer.isBuffer(msg)) {
        const data = msg.toJSON() as BufferJSON;
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
