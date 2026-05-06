import TestHelpers from '../helpers';
import { v4 as uuid } from 'uuid';

interface QueueTask {
  name: string;
  task: () => Promise<unknown>;
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}

interface DriverLike {
  runScript: (
    fn: (...args: unknown[]) => unknown,
    args?: unknown[],
  ) => Promise<unknown>;
}

export const taskQueue: QueueTask[] = [];
let isProcessing = false;

export const processQueue = async (): Promise<void> => {
  if (isProcessing || taskQueue.length === 0) return;

  isProcessing = true;
  const next = taskQueue.shift();
  if (!next) {
    isProcessing = false;
    return;
  }
  const { task, resolve, reject } = next;
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

export const addToQueue = ({
  task,
  resolve,
  reject,
  name,
}: QueueTask): Promise<void> => {
  taskQueue.push({ task, resolve, reject, name });
  return processQueue();
};

const pollResult = async (
  driver: DriverLike,
  generatedKey: string,
): Promise<unknown> => {
  let result;
  // eslint-disable-next-line no-loop-func
  await new Promise((resolve, reject) => {
    addToQueue({
      name: 'pollResult',
      task: async () => {
        await TestHelpers.delay(500);
        const text = await driver.runScript(
          (el, g) => (window as unknown as Record<string, unknown>)[g as string],
          [generatedKey],
        );
        if (typeof text === 'string') {
          result = JSON.parse(text);
        } else {
          result = text;
        }
        if (result !== undefined) {
          await driver.runScript(
            (el, g) => {
              delete (window as unknown as Record<string, unknown>)[
                g as string
              ];
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
  return pollResult(driver, generatedKey);
};

export const createDriverTransport =
  (driver: DriverLike) =>
  (_: unknown, method: string, params: unknown[]): Promise<unknown> => {
    const generatedKey = uuid();
    return new Promise((resolve, reject) => {
      const execute = async () => {
        await addToQueue({
          name: 'transport',
          task: async () => {
            await driver.runScript(
              (el, m, p, g) => {
                const w = window as unknown as {
                  ethereum: {
                    request: (args: {
                      method: unknown;
                      params: unknown;
                    }) => Promise<unknown>;
                  };
                } & Record<string, unknown>;
                w.ethereum
                  .request({ method: m, params: p })
                  .then((res: unknown) => {
                    w[g as string] = JSON.stringify({
                      result: res,
                    });
                  })
                  .catch(
                    (err: {
                      code: number;
                      message: string;
                      data?: unknown;
                    }) => {
                      w[g as string] = JSON.stringify({
                        error: {
                          code: err.code,
                          message: err.message,
                          data: err.data,
                        },
                      });
                    },
                  );
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
