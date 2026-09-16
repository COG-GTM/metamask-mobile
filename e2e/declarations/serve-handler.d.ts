/* eslint-disable import/no-nodejs-modules */
declare module 'serve-handler' {
  import type { IncomingMessage, ServerResponse } from 'http';

  interface ServeHandlerOptions {
    public?: string;
    cleanUrls?: boolean | string[];
    rewrites?: { source: string; destination: string }[];
    redirects?: { source: string; destination: string; type?: number }[];
    headers?: { source: string; headers: { key: string; value: string }[] }[];
    directoryListing?: boolean | string[];
    unlisted?: string[];
    trailingSlash?: boolean;
    renderSingle?: boolean;
    symlinks?: boolean;
    etag?: boolean;
  }

  function serveHandler(
    request: IncomingMessage,
    response: ServerResponse,
    config?: ServeHandlerOptions,
  ): Promise<void>;

  export = serveHandler;
}
