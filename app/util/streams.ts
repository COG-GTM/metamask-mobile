/* eslint-disable import/no-commonjs */
import type { Duplex } from 'stream';

const Through = require('through2');
const ObjectMultiplex = require('@metamask/object-multiplex');
const pump = require('pump');

export function jsonParseStream(): Duplex {
  return Through.obj(function (
    this: Duplex,
    serialized: string,
    _: BufferEncoding,
    cb: (err: Error | null, data?: Record<string, unknown>) => void,
  ) {
    this.push(JSON.parse(serialized));
    cb(null);
  });
}

export function jsonStringifyStream(): Duplex {
  return Through.obj(function (
    this: Duplex,
    obj: Record<string, unknown>,
    _: BufferEncoding,
    cb: (err: Error | null, data?: string) => void,
  ) {
    this.push(JSON.stringify(obj));
    cb(null);
  });
}

export function setupMultiplex(connectionStream: Duplex): {
  createStream: (name: string) => Duplex;
  [key: string]: unknown;
} {
  const mux = new ObjectMultiplex();
  pump(connectionStream, mux, connectionStream);
  return mux;
}
