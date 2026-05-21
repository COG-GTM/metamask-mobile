/* eslint-disable import/no-commonjs */
const Through = require('through2');
const ObjectMultiplex = require('@metamask/object-multiplex');
const pump = require('pump');

import { Duplex, Transform } from 'readable-stream';

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
