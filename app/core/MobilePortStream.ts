import { Buffer } from 'buffer';
import { Duplex } from 'readable-stream';

const noop = (): void => {};

interface Port {
  addListener: (event: string, callback: (msg?: unknown) => void) => void;
  postMessage: (data: unknown, url: string) => void;
}

interface BufferMessage {
  _isBuffer?: boolean;
  data?: number[];
  type?: string;
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

  _onMessage = function (this: PortDuplexStream, msg: BufferMessage | unknown): void {
    if (Buffer.isBuffer(msg)) {
      const bufferMsg = msg as BufferMessage;
      delete bufferMsg._isBuffer;
      const data = Buffer.from(msg);
      this.push(data);
    } else {
      this.push(msg);
    }
  };

  _onDisconnect = function (this: PortDuplexStream): void {
    this.destroy?.();
  };

  _read = noop;

  _write = function (
    this: PortDuplexStream,
    msg: Buffer | unknown,
    encoding: string,
    cb: (error?: Error | null) => void,
  ): void {
    try {
      if (Buffer.isBuffer(msg)) {
        const data: BufferMessage = (msg as Buffer).toJSON();
        data._isBuffer = true;
        this._port.postMessage(data, this._url);
      } else {
        this._port.postMessage(msg, this._url);
      }
    } catch (err) {
      cb(new Error('PortDuplexStream - disconnected'));
      return;
    }
    cb();
  };
}
