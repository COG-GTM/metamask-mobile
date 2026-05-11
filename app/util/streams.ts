/* eslint-disable import/no-commonjs */
import type { Transform } from 'stream';
import type { Duplex } from 'stream';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Through = require('through2');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const ObjectMultiplex = require('@metamask/object-multiplex');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pump = require('pump');

type ThroughCallback = (err?: Error | null) => void;

/**
 * Returns a stream transform that parses JSON strings passing through
 */
function jsonParseStream(): Transform {
  return Through.obj(function (
    this: Transform,
    serialized: string,
    _enc: BufferEncoding,
    cb: ThroughCallback,
  ): void {
    this.push(JSON.parse(serialized));
    cb();
  });
}

/**
 * Returns a stream transform that calls {@code JSON.stringify}
 * on objects passing through
 */
function jsonStringifyStream(): Transform {
  return Through.obj(function (
    this: Transform,
    obj: unknown,
    _enc: BufferEncoding,
    cb: ThroughCallback,
  ): void {
    this.push(JSON.stringify(obj));
    cb();
  });
}

/**
 * Sets up stream multiplexing for the given stream
 * @param connectionStream - the stream to mux
 * @returns the multiplexed stream
 */
function setupMultiplex(connectionStream: Duplex): Duplex {
  const mux = new ObjectMultiplex();
  pump(connectionStream, mux, connectionStream, (err: Error | null) => {
    if (err) {
      console.warn(err);
    }
  });
  return mux;
}

export { jsonParseStream, jsonStringifyStream, setupMultiplex };
