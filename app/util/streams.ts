/* eslint-disable import/no-commonjs */
const Through = require('through2');
const ObjectMultiplex = require('@metamask/object-multiplex');
const pump = require('pump');

/**
 * Returns a stream transform that parses JSON strings passing through
 * @return {stream.Transform}
 */
function jsonParseStream(): NodeJS.ReadWriteStream {
  return Through.obj(function (this: NodeJS.ReadWriteStream, serialized: string, _: unknown, cb: (error?: Error | null) => void) {
    this.push(JSON.parse(serialized));
    cb();
  });
}

/**
 * Returns a stream transform that calls {@code JSON.stringify}
 * on objects passing through
 * @return {stream.Transform} the stream transform
 */
function jsonStringifyStream(): NodeJS.ReadWriteStream {
  return Through.obj(function (this: NodeJS.ReadWriteStream, obj: unknown, _: unknown, cb: (error?: Error | null) => void) {
    this.push(JSON.stringify(obj));
    cb();
  });
}

/**
 * Sets up stream multiplexing for the given stream
 * @param {any} connectionStream - the stream to mux
 * @return {stream.Stream} the multiplexed stream
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function setupMultiplex(connectionStream: any): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mux = new ObjectMultiplex() as any;
  pump(connectionStream, mux, connectionStream, (err: Error | null) => {
    if (err) {
      console.warn(err);
    }
  });
  return mux;
}

export { jsonParseStream, jsonStringifyStream, setupMultiplex };
