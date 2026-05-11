// Minimal ambient declarations for the `koa` package used by the E2E fixture
// server. The repo does not depend on `@types/koa`, so we declare just the
// surface area used in e2e/.
declare module 'koa' {
  // eslint-disable-next-line import/no-nodejs-modules
  import { Server } from 'http';

  export interface ListenOptions {
    host?: string;
    port?: number;
    exclusive?: boolean;
  }

  export interface Context {
    method: string;
    path: string;
    body: unknown;
    set(header: string, value: string): void;
    [key: string]: unknown;
  }

  type Middleware = (ctx: Context, next: () => Promise<void>) => Promise<void> | void;

  class Koa {
    use(middleware: Middleware): this;
    listen(options?: ListenOptions | number): Server;
  }

  export default Koa;
}
