/**
 * Compiles regular expressions supplied by untrusted callers (e.g. the
 * `wallet_scanQRCode` filter sent by a dapp) while bounding the work a
 * backtracking engine can be forced to do.
 *
 * The cost model is deliberately conservative: every unbounded quantifier
 * (`*`, `+`, `{n,}`) may consume the whole input, every bounded quantifier
 * and alternation multiplies the number of paths, and an unanchored search
 * restarts at every input position.
 */

export const MAX_UNTRUSTED_PATTERN_LENGTH = 128;
export const MAX_UNTRUSTED_INPUT_LENGTH = 2048;
const MAX_MATCH_COST = 2 * MAX_UNTRUSTED_INPUT_LENGTH ** 2;

export class UntrustedRegExpError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UntrustedRegExpError';
  }
}

interface Frame {
  cost: number;
  alternatives: number;
  hasQuantifier: boolean;
  hasAlternation: boolean;
}

const newFrame = (): Frame => ({
  cost: 1,
  alternatives: 1,
  hasQuantifier: false,
  hasAlternation: false,
});

const BOUNDED_QUANTIFIER = /^\{(\d+)(,(\d*))?\}/;

const readQuantifier = (
  pattern: string,
  index: number,
): { length: number; choices: number } | undefined => {
  const char = pattern[index];
  let length = 0;
  let choices = 0;
  if (char === '*' || char === '+') {
    length = 1;
    choices = MAX_UNTRUSTED_INPUT_LENGTH;
  } else if (char === '?') {
    length = 1;
    choices = 2;
  } else if (char === '{') {
    const match = BOUNDED_QUANTIFIER.exec(pattern.slice(index));
    if (!match) return undefined;
    length = match[0].length;
    const min = Number(match[1]);
    if (match[2] === undefined) {
      choices = 1;
    } else if (match[3] === '') {
      choices = MAX_UNTRUSTED_INPUT_LENGTH;
    } else {
      choices = Math.max(Number(match[3]) - min, 0) + 1;
    }
  } else {
    return undefined;
  }
  if (pattern[index + length] === '?') length += 1;
  return { length, choices };
};

const fail = (reason: string): never => {
  throw new UntrustedRegExpError(`Unsupported regular expression: ${reason}`);
};

const assertBoundedCost = (pattern: string) => {
  const root = newFrame();
  const stack: Frame[] = [root];
  const current = () => stack[stack.length - 1];

  const applyQuantifier = (index: number, atomIsGroup: Frame | undefined) => {
    const quantifier = readQuantifier(pattern, index);
    if (!quantifier) return 0;
    if (
      atomIsGroup &&
      (atomIsGroup.hasQuantifier || atomIsGroup.hasAlternation)
    ) {
      fail('quantified groups may not contain quantifiers or alternation');
    }
    const frame = current();
    frame.cost *= quantifier.choices;
    if (quantifier.choices > 1) frame.hasQuantifier = true;
    return quantifier.length;
  };

  let i = 0;
  while (i < pattern.length) {
    const char = pattern[i];
    if (char === '\\') {
      const next = pattern[i + 1];
      if (/[1-9]/.test(next) || next === 'k') fail('backreferences');
      i += 2;
      i += applyQuantifier(i, undefined);
    } else if (char === '[') {
      let j = i + 1;
      if (pattern[j] === '^') j += 1;
      while (j < pattern.length && pattern[j] !== ']') {
        j += pattern[j] === '\\' ? 2 : 1;
      }
      i = j + 1;
      i += applyQuantifier(i, undefined);
    } else if (char === '(') {
      if (/^\(\?<?[=!]/.test(pattern.slice(i))) fail('lookarounds');
      stack.push(newFrame());
      i += 1;
    } else if (char === ')') {
      const group = stack.pop() as Frame;
      group.hasAlternation = group.hasAlternation || group.alternatives > 1;
      const parent = current();
      parent.cost *= group.cost * group.alternatives;
      parent.hasQuantifier = parent.hasQuantifier || group.hasQuantifier;
      parent.hasAlternation = parent.hasAlternation || group.hasAlternation;
      i += 1;
      i += applyQuantifier(i, group);
    } else if (char === '|') {
      current().alternatives += 1;
      i += 1;
    } else if (char === '^' || char === '$') {
      i += 1;
    } else {
      i += 1;
      i += applyQuantifier(i, undefined);
    }
  }

  const cost = MAX_UNTRUSTED_INPUT_LENGTH * root.cost * root.alternatives;
  if (cost > MAX_MATCH_COST) fail('too many repetitions or alternatives');
};

/**
 * Validates and compiles an untrusted regular expression source.
 *
 * @param pattern - Regular expression source supplied by an untrusted caller.
 * @returns The compiled regular expression.
 * @throws {UntrustedRegExpError} If the pattern is not a short string, does
 * not compile, or could backtrack excessively on inputs up to
 * {@link MAX_UNTRUSTED_INPUT_LENGTH} characters.
 */
export const compileUntrustedRegExp = (pattern: unknown): RegExp => {
  if (typeof pattern !== 'string') fail('pattern must be a string');
  const source = pattern as string;
  if (source.length > MAX_UNTRUSTED_PATTERN_LENGTH) {
    fail(`pattern exceeds ${MAX_UNTRUSTED_PATTERN_LENGTH} characters`);
  }
  let compiled: RegExp;
  try {
    compiled = new RegExp(source);
  } catch {
    return fail('pattern does not compile');
  }
  assertBoundedCost(source);
  return compiled;
};
