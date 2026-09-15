declare module 'readable-stream' {
  type NodeStream = typeof import('stream');

  export const Duplex: NodeStream['Duplex'];
  export type Duplex = import('stream').Duplex;
  export const PassThrough: NodeStream['PassThrough'];
  export type PassThrough = import('stream').PassThrough;
  export const Readable: NodeStream['Readable'];
  export type Readable = import('stream').Readable;
  export const Stream: NodeStream['Stream'];
  export type Stream = import('stream').Stream;
  export const Transform: NodeStream['Transform'];
  export type Transform = import('stream').Transform;
  export const Writable: NodeStream['Writable'];
  export type Writable = import('stream').Writable;
}
