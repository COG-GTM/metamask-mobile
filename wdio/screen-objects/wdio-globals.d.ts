/// <reference types="webdriverio/async" />
/// <reference types="expect-webdriverio/jest" />

// Custom command registered in wdio.conf.js `before` hook.
declare namespace WebdriverIOAsync {
  interface Browser {
    getPlatform(): string;
  }
}
