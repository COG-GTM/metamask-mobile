import { Duplex } from 'readable-stream';

const noop = (): undefined => undefined;

interface PostMessageStreamOptions {
  name: string;
  target: string;
  targetWindow?: Window;
}

interface PostMessage {
  target: string;
  data: unknown;
}

class PostMessageStream extends Duplex {
  private _name: string;
  private _target: string;
  private _targetWindow: Window;
  private _origin: string;
  private _init: boolean;
  private _haveSyn: boolean;

  constructor(opts: PostMessageStreamOptions) {
    super({
      objectMode: true,
    });

    this._name = opts.name;
    this._target = opts.target;
    this._targetWindow = opts.targetWindow || window;
    this._origin = opts.targetWindow ? '*' : location.origin;

    this._init = false;
    this._haveSyn = false;

    window.addEventListener('message', this._onMessage.bind(this), false);
    this._write('SYN', null, noop);
    this.cork();
  }

  private _onMessage(event: MessageEvent): void {
    const msg = event.data as PostMessage;

    if (this._origin !== '*' && event.origin !== this._origin) {
      return;
    }
    if (event.source !== this._targetWindow && window === top) {
      return;
    }
    if (!msg || typeof msg !== 'object') {
      return;
    }
    if (msg.target !== this._name) {
      return;
    }
    if (!msg.data) {
      return;
    }

    if (this._init) {
      try {
        this.push(msg.data);
      } catch (err) {
        this.emit('error', err);
      }
    } else if (msg.data === 'SYN') {
      this._haveSyn = true;
      this._write('ACK', null, noop);
    } else if (msg.data === 'ACK') {
      this._init = true;
      if (!this._haveSyn) {
        this._write('ACK', null, noop);
      }
      this.uncork();
    }
  }

  _read(): void {
    noop();
  }

  _write(data: unknown, _encoding: BufferEncoding | null, cb: () => void): void {
    const message: PostMessage = {
      target: this._target,
      data,
    };
    this._targetWindow.postMessage(message, this._origin);
    cb();
  }
}

export default PostMessageStream;
