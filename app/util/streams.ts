/* eslint-disable import/no-commonjs */
const Through = require('through2');
const ObjectMultiplex = require('@metamask/object-multiplex');
const pump = require('pump');

import type { Transform, TransformCallback, Stream } from 'stream';

/**
 * Returns a stream transform that parses JSON strings passing through
 * @return {stream.Transform}
 */
function jsonParseStream(): Transform {
  return Through.obj(function (
    this: Transform,
    serialized: string,
    _: unknown,
    cb: TransformCallback,
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
    _: unknown,
    cb: TransformCallback,
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
function setupMultiplex(connectionStream: Stream): Stream {
  const mux = new ObjectMultiplex();
  pump(connectionStream, mux, connectionStream, (err: Error | null) => {
    if (err) {
      console.warn(err);
    }
  });
  return mux;
}

export { jsonParseStream, jsonStringifyStream, setupMultiplex };
