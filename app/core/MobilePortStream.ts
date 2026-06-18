// eslint-disable-next-line import/no-nodejs-modules
import { Buffer } from 'buffer';
// eslint-disable-next-line import/no-nodejs-modules
import { Duplex } from 'stream';

interface Port {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addListener(event: string, callback: (...args: any[]) => void): void;
  postMessage(message: unknown, url: string): void;
  emit(event: string, ...args: unknown[]): void;
  name?: string;
}

// eslint-disable-next-line no-empty-function
const noop = (): void => {};

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
   * @param msg - Payload from the onMessage listener of Port
   */
  _onMessage(msg: Record<string, unknown>): void {
    if (Buffer.isBuffer(msg)) {
      delete msg._isBuffer;
      const data = Buffer.from(msg as unknown as string);
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
  _onDisconnect(): void {
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
  _write(msg: unknown, _encoding: string, cb: (error?: Error | null) => void): void {
    try {
      if (Buffer.isBuffer(msg)) {
        const data: Record<string, unknown> = (msg as Buffer).toJSON();
        data._isBuffer = true;
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
