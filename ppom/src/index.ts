import wasm from '@blockaid/ppom_release/ppom_bg.wasm';
import invoke from 'react-native-webview-invoke/browser';
import asyncInvoke from './invoke-lib';
import ppomInit, { PPOM } from './ppom';
// eslint-disable-next-line import/no-nodejs-modules
import { Buffer } from 'buffer';

type Base64File = [string, string];

(async () => {
  asyncInvoke(invoke);
  // eslint-disable-next-line no-console
  console.log = invoke.bind('console.log');
  console.error = invoke.bind('console.error');
  console.warn = invoke.bind('console.warn');

  function base64ToUint8Array(b64: string) {
    return Buffer.from(b64, 'base64');
  }

  function convertBase64ToFiles(base64Array: Base64File[]) {
    return base64Array.map(([key, base64]) => [
      key,
      base64ToUint8Array(base64),
    ]);
  }

  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let ppom: any;

  invoke.defineAsync('ppomInit', async () => {
    await ppomInit(base64ToUint8Array(wasm));
  });

  invoke.defineAsync('PPOM.new', async (files: Base64File[]) => {
    const jsonRpc = invoke.bindAsync('PPOM.jsonRpc');
    const decodedFiles = convertBase64ToFiles(files);
    ppom = await PPOM.new(
      (method: string, params: unknown) => jsonRpc(method, params),
      decodedFiles,
    );
  });

  invoke.define('PPOM.free', (...args: unknown[]) => {
    ppom.free(...args);
    ppom = undefined;
  });

  invoke.defineAsync(
    'PPOM.test',
    async (...args: unknown[]) => await ppom.test(...args),
  );

  invoke.defineAsync(
    'PPOM.validateJsonRpc',
    async (...args: unknown[]) => await ppom.validateJsonRpc(...args),
  );

  await invoke.bind('finishedLoading')();
})();
