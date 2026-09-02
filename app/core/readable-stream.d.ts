/* eslint-disable import/no-nodejs-modules */
/* eslint-disable import/no-namespace */
/**
 * Minimal typings for `readable-stream`, which ships no type definitions.
 * The package mirrors Node's `stream` API, so the Node types are reused.
 */
declare module 'readable-stream' {
  import * as stream from 'stream';

  export const Duplex: typeof stream.Duplex;
  export type Duplex = stream.Duplex;
  export const Readable: typeof stream.Readable;
  export type Readable = stream.Readable;
  export const Writable: typeof stream.Writable;
  export type Writable = stream.Writable;
  export const Transform: typeof stream.Transform;
  export type Transform = stream.Transform;
  export const PassThrough: typeof stream.PassThrough;
  export type PassThrough = stream.PassThrough;
  export const pipeline: typeof stream.pipeline;
}
