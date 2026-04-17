/* eslint-disable import/no-commonjs */
import { Duplex } from 'stream';

const Through = require('through2');
const ObjectMultiplex = require('@metamask/object-multiplex');
const pump = require('pump');

/**
 * Returns a stream transform that parses JSON strings passing through
 * @return {stream.Transform}
 */
function jsonParseStream(): Duplex {
  return Through.obj(function (
    this: Duplex,
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
function jsonStringifyStream(): Duplex {
  return Through.obj(function (
    this: Duplex,
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
function setupMultiplex(connectionStream: Duplex): Duplex {
  const mux: Duplex = new ObjectMultiplex();
  pump(connectionStream, mux, connectionStream, (err: Error | undefined) => {
    if (err) {
      console.warn(err);
    }
  });
  return mux;
}

export { jsonParseStream, jsonStringifyStream, setupMultiplex };
