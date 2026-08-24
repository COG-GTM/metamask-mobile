/* eslint-disable import/no-commonjs, @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires -- these packages ship no type declarations */
import type ObjectMultiplexType from '@metamask/object-multiplex';

const Through = require('through2');
const ObjectMultiplex = require('@metamask/object-multiplex');
const pump = require('pump');

interface PushableStream {
  push(chunk: unknown): boolean;
}

type TransformCallback = (error?: Error | null) => void;

/**
 * Returns a stream transform that parses JSON strings passing through
 * @return {stream.Transform}
 */
function jsonParseStream() {
  return Through.obj(function (
    this: PushableStream,
    serialized: string,
    _: BufferEncoding,
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
function jsonStringifyStream() {
  return Through.obj(function (
    this: PushableStream,
    obj: unknown,
    _: BufferEncoding,
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
function setupMultiplex(connectionStream: unknown): ObjectMultiplexType {
  const mux: ObjectMultiplexType = new ObjectMultiplex();
  pump(connectionStream, mux, connectionStream, (err: Error | null) => {
    if (err) {
      console.warn(err);
    }
  });
  return mux;
}

export { jsonParseStream, jsonStringifyStream, setupMultiplex };
