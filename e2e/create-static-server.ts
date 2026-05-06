/* eslint-disable import/no-nodejs-modules */
import http from 'http';
import path from 'path';
// @ts-expect-error serve-handler has no types in this lockfile
import serveHandler from 'serve-handler';

const createStaticServer = function (rootDirectory: string) {
  return http.createServer((request, response) => {
    const url = request.url || '';
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
