/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable import/no-commonjs */
/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-var-requires */
const Through = require('through2');
const ObjectMultiplex = require('@metamask/object-multiplex');
const pump = require('pump');

/**
 * Returns a stream transform that parses JSON strings passing through
 * @return {stream.Transform}
 */
function jsonParseStream(): any {
  return Through.obj(function (this: any, serialized: any, _: any, cb: any) {
    this.push(JSON.parse(serialized));
    cb();
  });
}

/**
 * Returns a stream transform that calls {@code JSON.stringify}
 * on objects passing through
 * @return {stream.Transform} the stream transform
 */
function jsonStringifyStream(): any {
  return Through.obj(function (this: any, obj: any, _: any, cb: any) {
    this.push(JSON.stringify(obj));
    cb();
  });
}

/**
 * Sets up stream multiplexing for the given stream
 * @param {any} connectionStream - the stream to mux
 * @return {stream.Stream} the multiplexed stream
 */
function setupMultiplex(connectionStream: any): any {
  const mux = new ObjectMultiplex();
  pump(connectionStream, mux, connectionStream, (err: any) => {
    if (err) {
      console.warn(err);
    }
  });
  return mux;
}

export { jsonParseStream, jsonStringifyStream, setupMultiplex };
