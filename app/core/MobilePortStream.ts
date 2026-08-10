// eslint-disable-next-line import/no-nodejs-modules
import { Buffer } from 'buffer';
// eslint-disable-next-line import/no-nodejs-modules
import type { Duplex as NodeDuplex } from 'stream';
// `readable-stream` ships no type declarations, so the Node stream types are
// used to describe the runtime implementation.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error - no type declarations for readable-stream
import { Duplex as ReadableStreamDuplex } from 'readable-stream';

const Duplex: typeof NodeDuplex = ReadableStreamDuplex;

// eslint-disable-next-line no-empty-function
const noop = () => {};

/**
 * Minimal shape of the port objects used by the mobile bridge
 * (Port, RemotePort and WalletConnectPort).
 */
export interface MobilePort {
  addListener(event: string, handler: (...args: unknown[]) => void): void;
  postMessage(msg: unknown, origin?: string): void;
}

interface BufferJson {
  type: 'Buffer';
  data: number[];
  _isBuffer?: boolean;
}

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
  _onMessage = function (this: PortDuplexStream, msg: unknown) {
    if (Buffer.isBuffer(msg)) {
      const bufferMsg = msg as Buffer & { _isBuffer?: boolean };
      delete bufferMsg._isBuffer;
      const data = Buffer.from(bufferMsg);
      this.push(data);
    } else {
      this.push(msg);
    }
  };

  /**
   * Callback triggered when the remote Port
   * associated with this Stream disconnects.
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
   * @param msg - Arbitrary object to write
   * @param encoding - Encoding to use when writing payload
   * @param cb - Called when writing is complete or an error occurs
   */
  _write = function (
    this: PortDuplexStream,
    msg: unknown,
    _encoding: string,
    cb: (error?: Error) => void,
  ) {
    try {
      if (Buffer.isBuffer(msg)) {
        const data = msg.toJSON() as BufferJson;
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
