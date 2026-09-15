declare module 'through2' {
  export interface Through2Stream extends NodeJS.ReadWriteStream {
    push(chunk: unknown, encoding?: BufferEncoding): boolean;
    destroy(error?: Error): void;
  }

  export interface Through2Options {
    objectMode?: boolean;
    highWaterMark?: number;
    allowHalfOpen?: boolean;
  }

  export type TransformCallback = (
    error?: Error | null,
    data?: unknown,
  ) => void;

  export type TransformFunction = (
    this: Through2Stream,
    chunk: unknown,
    encoding: BufferEncoding,
    callback: TransformCallback,
  ) => void;

  export type FlushFunction = (
    this: Through2Stream,
    callback: TransformCallback,
  ) => void;

  interface Through2 {
    (
      options?: Through2Options,
      transform?: TransformFunction,
      flush?: FlushFunction,
    ): Through2Stream;
    (transform?: TransformFunction, flush?: FlushFunction): Through2Stream;
    obj(
      options?: Through2Options,
      transform?: TransformFunction,
      flush?: FlushFunction,
    ): Through2Stream;
    obj(transform?: TransformFunction, flush?: FlushFunction): Through2Stream;
  }

  const through2: Through2;
  export = through2;
}
