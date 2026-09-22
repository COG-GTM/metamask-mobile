const ESCAPED_CHARACTERS: Record<string, string> = {
  '<': '\\u003c',
  '>': '\\u003e',
  '&': '\\u0026',
  '\u2028': '\\u2028',
  '\u2029': '\\u2029',
};

/**
 * Serializes a value into a JavaScript literal that is safe to interpolate
 * into a script injected in a WebView, preventing the value from breaking out
 * of its literal and being evaluated as code.
 *
 * @param value - Value to serialize.
 * @returns JavaScript literal representation of the value.
 */
const toJsLiteral = (value: unknown): string => {
  const serialized = JSON.stringify(value);
  if (serialized === undefined) {
    return 'undefined';
  }
  return serialized.replace(
    /[<>&\u2028\u2029]/g,
    (character) => ESCAPED_CHARACTERS[character],
  );
};

export default toJsLiteral;
