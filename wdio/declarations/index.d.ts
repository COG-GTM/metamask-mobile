// Custom command registered in the `before` hook of wdio.conf.js
declare namespace WebdriverIOAsync {
  interface Browser {
    getPlatform(): string;
  }
}

declare module 'xml2js' {
  export interface JunitReport {
    testsuites: { testsuite: { $: { name: string } }[] };
  }
  export class Parser {
    parseString(
      str: string,
      callback: (err: Error | null, result: JunitReport) => void,
    ): void;
  }
}

declare module 'multiple-cucumber-html-reporter' {
  export function generate(options: {
    jsonDir: string;
    reportPath: string;
  }): void;
}
