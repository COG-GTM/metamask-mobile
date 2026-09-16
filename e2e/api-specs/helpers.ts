import TestHelpers from '../helpers';
import { v4 as uuid } from 'uuid';

export type WebDriver = Detox.WebElement;

interface QueueTask {
  name: string;
  task: () => Promise<unknown>;
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}

interface EthereumWindow {
  ethereum: {
    request: (args: { method: string; params: unknown }) => Promise<unknown>;
  };
  [key: string]: unknown;
}

// `window` here refers to the dapp webview page in which runScript callbacks execute
// eslint-disable-next-line @typescript-eslint/no-shadow
declare const window: EthereumWindow;

export const taskQueue: QueueTask[] = [];
let isProcessing = false;

export const processQueue = async () => {
  if (isProcessing || taskQueue.length === 0) return;

  isProcessing = true;
  const { task, resolve, reject } = taskQueue.shift() as QueueTask;
  try {
    const result = await task();
    resolve(result);
  } catch (error) {
    reject(error);
  } finally {
    isProcessing = false;
    await processQueue();
  }
};

export const addToQueue = ({ task, resolve, reject, name }: QueueTask) => {
  taskQueue.push({ task, resolve, reject, name });
  return processQueue();
};

const pollResult = async (
  webDriver: WebDriver,
  generatedKey: string,
): Promise<unknown> => {
  let result: unknown;
  // eslint-disable-next-line no-loop-func
  await new Promise((resolve, reject) => {
    addToQueue({
      name: 'pollResult',
      task: async () => {
        await TestHelpers.delay(500);
        const text = await webDriver.runScript(
          (_el, g) => window[g],
          [generatedKey],
        );
        if (typeof text === 'string') {
          result = JSON.parse(text);
        } else {
          result = text;
        }
        if (result !== undefined) {
          await webDriver.runScript(
            (_el, g) => {
              delete window[g];
            },
            [generatedKey],
          );
        }
        return result;
      },
      resolve,
      reject,
    });
  });
  if (result !== undefined) {
    return result;
  }
  return pollResult(webDriver, generatedKey);
};

export const createDriverTransport =
  (webDriver: WebDriver) => (_: string, method: string, params: unknown[]) => {
    const generatedKey = uuid();
    return new Promise((resolve, reject) => {
      const execute = async () => {
        await addToQueue({
          name: 'transport',
          task: async () => {
            await webDriver.runScript(
              (_el, m, p, g) => {
                window.ethereum
                  .request({ method: m, params: p })
                  .then((res) => {
                    window[g] = JSON.stringify({
                      result: res,
                    });
                  })
                  .catch((err) => {
                    window[g] = JSON.stringify({
                      error: {
                        code: err.code,
                        message: err.message,
                        data: err.data,
                      },
                    });
                  });
              },
              [method, params, generatedKey],
            );
          },
          resolve,
          reject,
        });
      };
      return execute();
    }).then(async () => {
      const result = await pollResult(webDriver, generatedKey);
      return result;
    });
  };
