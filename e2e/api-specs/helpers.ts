import TestHelpers from '../helpers';
import { v4 as uuid } from 'uuid';

interface Driver {
  runScript<T = unknown>(
    script: (...args: unknown[]) => unknown,
    args?: unknown[],
  ): Promise<T>;
}

interface QueuedTask {
  task: () => Promise<unknown>;
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
  name: string;
}

export const taskQueue: QueuedTask[] = [];
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
}: QueuedTask): Promise<void> => {
  taskQueue.push({ task, resolve, reject, name });
  return processQueue();
};

const pollResult = async (
  webDriver: Driver,
  generatedKey: string,
): Promise<unknown> => {
  let result: unknown;
  // eslint-disable-next-line no-loop-func
  await new Promise<void>((resolve, reject) => {
    addToQueue({
      name: 'pollResult',
      task: async () => {
        await TestHelpers.delay(500);
        const text = await webDriver.runScript<string | unknown>(
          (...args: unknown[]) => {
            const g = args[1] as string;
            return (window as unknown as Record<string, unknown>)[g];
          },
          [generatedKey],
        );
        if (typeof text === 'string') {
          result = JSON.parse(text);
        } else {
          result = text;
        }
        if (result !== undefined) {
          await webDriver.runScript(
            (...args: unknown[]) => {
              const g = args[1] as string;
              delete (window as unknown as Record<string, unknown>)[g];
            },
            [generatedKey],
          );
        }
        return result;
      },
      resolve: () => resolve(),
      reject,
    });
  });
  if (result !== undefined) {
    return result;
  }
  return pollResult(webDriver, generatedKey);
};

export const createDriverTransport =
  (webDriver: Driver) =>
  (
    _: unknown,
    method: string,
    params: unknown,
  ): Promise<unknown> => {
    const generatedKey = uuid();
    return new Promise<void>((resolve, reject) => {
      const execute = async (): Promise<void> => {
        await addToQueue({
          name: 'transport',
          task: async () => {
            await webDriver.runScript(
              (...args: unknown[]) => {
                const m = args[1] as string;
                const p = args[2] as unknown;
                const g = args[3] as string;
                const ethereum = (
                  window as unknown as {
                    ethereum: {
                      request: (req: {
                        method: string;
                        params: unknown;
                      }) => Promise<unknown>;
                    };
                  }
                ).ethereum;
                ethereum
                  .request({ method: m, params: p })
                  .then((res: unknown) => {
                    (window as unknown as Record<string, unknown>)[g] =
                      JSON.stringify({
                        result: res,
                      });
                  })
                  .catch(
                    (err: { code?: number; message?: string; data?: unknown }) => {
                      (window as unknown as Record<string, unknown>)[g] =
                        JSON.stringify({
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
          resolve: () => resolve(),
          reject,
        });
      };
      void execute();
    }).then(async () => {
      const result = await pollResult(webDriver, generatedKey);
      return result;
    });
  };
