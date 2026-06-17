/* eslint-disable import/no-commonjs, @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires */
const Through = require('through2');
const ObjectMultiplex = require('@metamask/object-multiplex');
const pump = require('pump');

/**
 * Returns a stream transform that parses JSON strings passing through
 * @return {stream.Transform}
 */
interface ThroughTransform {
  push: (chunk: unknown) => void;
}

function jsonParseStream() {
  return Through.obj(function (
    this: ThroughTransform,
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
function jsonStringifyStream() {
  return Through.obj(function (
    this: ThroughTransform,
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
function setupMultiplex(connectionStream: unknown) {
  const mux = new ObjectMultiplex();
  pump(connectionStream, mux, connectionStream, (err: Error | undefined) => {
    if (err) {
      console.warn(err);
    }
  });
  return mux;
}

export { jsonParseStream, jsonStringifyStream, setupMultiplex };
