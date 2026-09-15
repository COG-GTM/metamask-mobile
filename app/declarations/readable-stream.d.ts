declare module 'readable-stream' {
  // eslint-disable-next-line import/no-nodejs-modules
  import {
    Duplex,
    PassThrough,
    Readable,
    Stream,
    Transform,
    Writable,
  } from 'stream';

  export { Duplex, PassThrough, Readable, Stream, Transform, Writable };
}
