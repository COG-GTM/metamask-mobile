/* eslint-disable import/no-commonjs */
/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-var-requires */
// eslint-disable-next-line import/no-nodejs-modules
import { Duplex, Transform } from 'stream';
import ObjectMultiplex from '@metamask/object-multiplex';

const Through = require('through2');
const pump = require('pump');

/**
 * Returns a stream transform that parses JSON strings passing through
 * @return {stream.Transform}
 */
function jsonParseStream(): Transform {
  return Through.obj(function (
    this: Transform,
    serialized: string,
    _: string,
    cb: () => void,
  ) {
    this.push(JSON.parse(serialized));
    cb();
  });
}

/**
 * Returns a stream transform that calls {@code JSON.stringify}
 * on objects passing through
 * @return {stream.Transform} the stream transform
 */
function jsonStringifyStream(): Transform {
  return Through.obj(function (
    this: Transform,
    obj: unknown,
    _: string,
    cb: () => void,
  ) {
    this.push(JSON.stringify(obj));
    cb();
  });
}

/**
 * Sets up stream multiplexing for the given stream
 * @param {any} connectionStream - the stream to mux
 * @return {stream.Stream} the multiplexed stream
 */
function setupMultiplex(connectionStream: Duplex): ObjectMultiplex {
  const mux = new ObjectMultiplex();
  pump(connectionStream, mux, connectionStream, (err?: Error) => {
    if (err) {
      console.warn(err);
    }
  });
  return mux;
}

export { jsonParseStream, jsonStringifyStream, setupMultiplex };
