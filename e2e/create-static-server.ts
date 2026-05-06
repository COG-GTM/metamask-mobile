/* eslint-disable import/no-nodejs-modules */
import http from 'http';
import path from 'path';
// `serve-handler` does not ship TypeScript declarations.
// eslint-disable-next-line @typescript-eslint/no-require-imports, import/no-commonjs
const serveHandler = require('serve-handler') as (
  request: http.IncomingMessage,
  response: http.ServerResponse,
  options?: { directoryListing?: boolean; public?: string },
) => Promise<void>;

const createStaticServer = function (rootDirectory: string): http.Server {
  return http.createServer((request, response) => {
    if (request.url && request.url.startsWith('/node_modules/')) {
      request.url = request.url.substr(14);
      return serveHandler(request, response, {
        directoryListing: false,
        public: path.resolve('./node_modules'),
      });
    }
    return serveHandler(request, response, {
      directoryListing: false,
      public: rootDirectory,
    });
  });
};

export default createStaticServer;
