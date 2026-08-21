/**
 * `readable-stream` v2 ships no type declarations. It is API compatible with
 * the Node.js `stream` module, so its types are reused here.
 */
declare module 'readable-stream' {
  // eslint-disable-next-line import/no-nodejs-modules
  export {
    Duplex,
    PassThrough,
    Readable,
    Stream,
    Transform,
    Writable,
  } from 'stream';
}
