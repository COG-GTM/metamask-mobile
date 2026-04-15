import CryptoJS from 'crypto-js';

function generateRandomNumber() {
  const range = 1000;
  const randomBytes = CryptoJS.lib.WordArray.random(range);
  const randomNumber = randomBytes.words[0] % range;
  return randomNumber;
}

// TODO: Replace "any" with type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function serializeError(error) {
  const serialized = {};
  Object.getOwnPropertyNames(error).forEach((key) => {
    serialized[key] = error[key];
  });
  return serialized;
}

// TODO: Replace "any" with type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function deserializeError(data) {
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const error = new Error(data.message);
  Object.getOwnPropertyNames(data).forEach((key) => {
    error[key] = data[key];
  });
  return error;
}

// TODO: Replace "any" with type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default (invoke) => {
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  invoke.defineAsync = (name, func) => {
    const resolveCallback = invoke.bind(`${name}_resolve`);
    const rejectCallback = invoke.bind(`${name}_reject`);

    // TODO: Replace "any" with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    invoke.define(`${name}_trigger`, ({ id, args }) => {
      func(...args)
      // TODO: Replace "any" with type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((...args2) => resolveCallback({ id, args: args2 })).
      catch((e) => rejectCallback({ id, error: serializeError(e) }));
    });
  };

  invoke.bindAsync = (name) => {
    // TODO: Replace "any" with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const callbacks = {};
    const trigger = invoke.bind(`${name}_trigger`);

    // TODO: Replace "any" with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    invoke.define(`${name}_resolve`, ({ id, args }) => {
      const { resolve } = callbacks[id];
      delete callbacks[id];
      resolve(...args);
    });

    // TODO: Replace "any" with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    invoke.define(`${name}_reject`, ({ id, error }) => {
      const { reject } = callbacks[id];
      delete callbacks[id];
      reject(deserializeError(error));
    });

    // TODO: Replace "any" with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (...args) => {
      const id = generateRandomNumber();
      return new Promise((resolve, reject) => {
        callbacks[id] = { resolve, reject };
        trigger({ id, args }).catch(reject);
      });
    };
  };
};