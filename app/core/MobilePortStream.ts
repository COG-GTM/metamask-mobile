// eslint-disable-next-line import/no-nodejs-modules
import { Buffer } from 'buffer';
import { Duplex } from 'readable-stream';

/**
 * A message received from, or sent to, the remote Port. When it originates from
 * a serialized Buffer it carries the `_isBuffer` marker used to reconstruct it.
 */
type PortMessage = Buffer | { _isBuffer?: boolean; [key: string]: unknown };

/**
 * The subset of the Port API that {@link PortDuplexStream} relies on.
 */
interface MobilePort {
  addListener(event: 'message', listener: (message: PortMessage) => void): void;
  addListener(event: 'disconnect', listener: () => void): void;
  postMessage(message: unknown, origin?: string): void;
}

// eslint-disable-next-line no-empty-function
const noop = () => {
  /* no-op */
};

export default class PortDuplexStream extends Duplex {
  _port: MobilePort;
  _url?: string;

  constructor(port: MobilePort, url?: string) {
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
  _onMessage = (msg: PortMessage) => {
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
    msg: PortMessage,
    _encoding: BufferEncoding,
    cb: (error?: Error | null) => void,
  ) => {
    try {
      if (Buffer.isBuffer(msg)) {
        const data: {
          type: 'Buffer';
          data: number[];
          _isBuffer?: boolean;
        } = msg.toJSON();
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
