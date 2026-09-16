import type { IMessager } from 'react-native-webview-invoke/browser';

type SerializedError = Record<string, unknown>;

interface AsyncPayload<Args extends unknown[] = unknown[]> {
  id: string;
  args: Args;
}

interface AsyncRejectPayload {
  id: string;
  error: SerializedError;
}

interface PendingCallback {
  resolve: (...args: unknown[]) => void;
  reject: (reason?: unknown) => void;
}

function serializeError(error: Error): SerializedError {
  const serialized: SerializedError = {};
  Object.getOwnPropertyNames(error).forEach((key) => {
    serialized[key] = error[key as keyof Error];
  });
  return serialized;
}

function deserializeError(data: SerializedError): Error {
  const error = new Error(data.message as string) as Error & SerializedError;
  Object.getOwnPropertyNames(data).forEach((key) => {
    error[key] = data[key];
  });
  return error;
}

export default (invoke: IMessager) => {
  invoke.defineAsync = (name, func) => {
    const resolveCallback = invoke.bind(`${name}_resolve`);
    const rejectCallback = invoke.bind(`${name}_reject`);

    invoke.define(`${name}_trigger`, ({ id, args }: AsyncPayload<Parameters<typeof func>>) => {
      func(...args)
        .then((...args) => resolveCallback({ id, args }))
        .catch((e) => rejectCallback({ id, error: serializeError(e) }));
    });
  };

  invoke.bindAsync = (name) => {
    const callbacks: Record<string, PendingCallback> = {};
    const trigger = invoke.bind(`${name}_trigger`);

    invoke.define(`${name}_resolve`, ({ id, args }: AsyncPayload) => {
      const { resolve } = callbacks[id];
      delete callbacks[id];
      resolve(...args);
    });

    invoke.define(`${name}_reject`, ({ id, error }: AsyncRejectPayload) => {
      const { reject } = callbacks[id];
      delete callbacks[id];
      reject(deserializeError(error));
    });

    return (...args) => {
      const id = Math.random().toString(36).substring(2, 15);
      return new Promise((resolve, reject) => {
        callbacks[id] = { resolve, reject };
        trigger({ id, args }).catch(reject);
      });
    };
  };
};
