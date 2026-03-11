/* eslint-disable import/no-commonjs, @typescript-eslint/no-var-requires */
const Through = require('through2');
const ObjectMultiplex = require('@metamask/object-multiplex');
const pump = require('pump');

import { Duplex } from 'stream';

/**
 * Returns a stream transform that parses JSON strings passing through
 * @return {stream.Transform}
 */
function jsonParseStream() {
  return Through.obj(function (
    this: { push: (data: unknown) => void },
    serialized: string,
    _: unknown,
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
function jsonStringifyStream() {
  return Through.obj(function (
    this: { push: (data: unknown) => void },
    obj: unknown,
    _: unknown,
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
function setupMultiplex(connectionStream: Duplex) {
  const mux = new ObjectMultiplex();
  pump(connectionStream, mux, connectionStream, (err: Error | undefined) => {
    if (err) {
      console.warn(err);
    }
  });
  return mux;
}

export { jsonParseStream, jsonStringifyStream, setupMultiplex };
