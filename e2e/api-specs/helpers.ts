import TestHelpers from '../helpers';
import { v4 as uuid } from 'uuid';

interface QueueTask {
  task: () => Promise<unknown>;
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
  name: string;
}

interface DriverLike {
  runScript: (script: unknown, args?: unknown[]) => Promise<unknown>;
}

export const taskQueue: QueueTask[] = [];
let isProcessing = false;

export const processQueue = async (): Promise<void> => {
  if (isProcessing || taskQueue.length === 0) return;

  isProcessing = true;
  const item = taskQueue.shift();
  if (!item) {
    isProcessing = false;
    return;
  }
  const { task, resolve, reject } = item;
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

export const addToQueue = ({ task, resolve, reject, name }: QueueTask): Promise<void> => {
  taskQueue.push({ task, resolve, reject, name });
  return processQueue();
};

const pollResult = async (driver: DriverLike, generatedKey: string): Promise<unknown> => {
  let result: unknown;
  // eslint-disable-next-line no-loop-func
  await new Promise<void>((resolve, reject) => {
    addToQueue({
      name: 'pollResult',
      task: async () => {
        await TestHelpers.delay(500);
        const text = await driver.runScript(
          (el: unknown, g: string) =>
            (window as unknown as Record<string, unknown>)[g],
          [generatedKey],
        );
        if (typeof text === 'string') {
          result = JSON.parse(text);
        } else {
          result = text;
        }
        if (result !== undefined) {
          await driver.runScript(
            (el: unknown, g: string) => {
              delete (window as unknown as Record<string, unknown>)[g];
            },
            [generatedKey],
          );
        }
        return result;
      },
      resolve: resolve as (value?: unknown) => void,
      reject,
    });
  });
  if (result !== undefined) {
    return result;
  }
  return pollResult(driver, generatedKey);
};

export const createDriverTransport =
  (driver: DriverLike) =>
  (_: unknown, method: string, params: unknown[]) => {
    const generatedKey = uuid();
    return new Promise((resolve, reject) => {
      const execute = async () => {
        await addToQueue({
          name: 'transport',
          task: async () => {
            await driver.runScript(
              (el: unknown, m: string, p: unknown[], g: string) => {
                (window as unknown as { ethereum: { request: (req: unknown) => Promise<unknown> } }).ethereum
                  .request({ method: m, params: p })
                  .then((res: unknown) => {
                    (window as unknown as Record<string, unknown>)[g] = JSON.stringify({
                      result: res,
                    });
                  })
                  .catch((err: { code?: number; message?: string; data?: unknown }) => {
                    (window as unknown as Record<string, unknown>)[g] = JSON.stringify({
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
      const result = await pollResult(driver, generatedKey);
      return result;
    });
  };
