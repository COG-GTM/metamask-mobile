/* eslint-disable import/no-nodejs-modules */
import http from 'http';
import path from 'path';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - serve-handler does not ship its own type declarations
import serveHandler from 'serve-handler';

const createStaticServer = function (rootDirectory: string) {
  return http.createServer((request, response) => {
    const url = request.url ?? '';
    if (url.startsWith('/node_modules/')) {
      request.url = url.substr(14);
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
