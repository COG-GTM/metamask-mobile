// eslint-disable-next-line import/no-nodejs-modules
import { Buffer } from 'buffer';
import { Duplex } from 'readable-stream';

// eslint-disable-next-line no-empty-function
const noop = (): void => {};

interface Port {
  addListener(event: string, callback: (...args: unknown[]) => void): void;
  postMessage(data: unknown, url: string): void;
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

  _onMessage = function (this: PortDuplexStream, msg: Record<string, unknown>): void {
    if (Buffer.isBuffer(msg)) {
      delete msg._isBuffer;
      const data = new Buffer(msg);
      this.push(data);
    } else {
      this.push(msg);
    }
  };

  _onDisconnect = function (this: PortDuplexStream): void {
    this.destroy && this.destroy();
  };

  _read = noop;

  _write = function (
    this: PortDuplexStream,
    msg: Record<string, unknown>,
    encoding: string,
    cb: (error?: Error) => void,
  ): void {
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
  };
}
