/**
 * Lossless JSON encoding for reducer parity transcripts.
 *
 * Plain JSON drops object keys whose value is `undefined` and turns `undefined`
 * array items into `null`, which would hide differences that `toStrictEqual`
 * detects. `undefined` and `Error` instances are therefore encoded as sentinels.
 */
export const UNDEFINED_SENTINEL = '__PARITY_UNDEFINED__';
export const ERROR_KEY = '__PARITY_ERROR__';

export type Encoded =
  | string
  | number
  | boolean
  | null
  | Encoded[]
  | { [key: string]: Encoded };

export function encode(value: unknown): Encoded {
  if (value === undefined) return UNDEFINED_SENTINEL;
  if (value === null) return null;
  if (value instanceof Error) {
    return { [ERROR_KEY]: { name: value.name, message: value.message } };
  }
  if (Array.isArray(value)) return value.map((item) => encode(item));
  switch (typeof value) {
    case 'string':
    case 'boolean':
      return value;
    case 'number':
      if (!Number.isFinite(value)) {
        throw new Error(`Cannot encode non-finite number ${value}`);
      }
      return value;
    case 'object': {
      const result: { [key: string]: Encoded } = {};
      for (const key of Object.keys(value as object)) {
        result[key] = encode((value as Record<string, unknown>)[key]);
      }
      return result;
    }
    default:
      throw new Error(`Cannot encode value of type ${typeof value}`);
  }
}

export function decode(value: Encoded): unknown {
  if (value === UNDEFINED_SENTINEL) return undefined;
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map((item) => decode(item));
  const keys = Object.keys(value);
  if (keys.length === 1 && keys[0] === ERROR_KEY) {
    const { name, message } = value[ERROR_KEY] as {
      name: string;
      message: string;
    };
    const error = new Error(message);
    error.name = name;
    return error;
  }
  const result: Record<string, unknown> = {};
  for (const key of keys) {
    result[key] = decode(value[key]);
  }
  return result;
}
