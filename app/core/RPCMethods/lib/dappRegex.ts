export const MAX_DAPP_REGEX_PATTERN_LENGTH = 256;
export const MAX_DAPP_REGEX_BACKTRACKING_COST = 1e7;

/**
 * A variable-count quantifier: `min`..`max` repetitions (`max` may be Infinity).
 */
interface QuantifierRange {
  min: number;
  max: number;
}

interface GroupFrame {
  alternatives: number;
  containsVariableQuantifier: boolean;
}

interface ParsedQuantifier {
  min: number;
  max: number;
  length: number;
}

const readQuantifier = (
  pattern: string,
  index: number,
): ParsedQuantifier | null => {
  const char = pattern[index];
  let min: number;
  let max: number;
  let length: number;

  if (char === '*') {
    [min, max, length] = [0, Infinity, 1];
  } else if (char === '+') {
    [min, max, length] = [1, Infinity, 1];
  } else if (char === '?') {
    [min, max, length] = [0, 1, 1];
  } else if (char === '{') {
    const match = /^\{(\d+)(,(\d*))?\}/.exec(pattern.slice(index));
    if (!match) {
      return null;
    }
    min = Number(match[1]);
    if (match[2] === undefined) {
      max = min;
    } else {
      max = match[3] === '' ? Infinity : Number(match[3]);
    }
    length = match[0].length;
  } else {
    return null;
  }

  if (pattern[index + length] === '?') {
    length += 1;
  }
  return { min, max, length };
};

const isVariable = ({ min, max }: { min: number; max: number }) => max > min;
const isRepeating = ({ max }: { max: number }) => max > 1;

/**
 * Statically analyses a regular expression supplied by an untrusted dapp and
 * rejects constructs that can cause catastrophic backtracking: backreferences,
 * repeated groups that contain variable quantifiers or alternation (e.g.
 * `(a+)+`, `(a|aa)*`). Returns the variable quantifiers and alternation
 * branching factors needed to bound the backtracking cost for a given input.
 */
const analysePattern = (pattern: string) => {
  const quantifiers: QuantifierRange[] = [];
  const branchFactors: number[] = [];
  const stack: GroupFrame[] = [
    { alternatives: 1, containsVariableQuantifier: false },
  ];
  let i = 0;

  const applyQuantifier = (
    target: GroupFrame | null,
    quantifier: ParsedQuantifier,
  ) => {
    const current = stack[stack.length - 1];
    if (target && isRepeating(quantifier)) {
      if (target.containsVariableQuantifier || target.alternatives > 1) {
        throw new Error('Nested or ambiguous repetition is not allowed');
      }
    }
    if (isVariable(quantifier)) {
      quantifiers.push({ min: quantifier.min, max: quantifier.max });
      current.containsVariableQuantifier = true;
      return true;
    }
    return false;
  };
  // A variable quantifier on the final top-level atom never backtracks: once
  // it is reached, the rest of the pattern is empty and the match succeeds.
  let endsWithFreeQuantifier = false;

  while (i < pattern.length) {
    const char = pattern[i];

    if (char === '\\') {
      const next = pattern[i + 1];
      if (next === undefined) {
        throw new Error('Invalid escape');
      }
      if (/[1-9]/.test(next) || next === 'k') {
        throw new Error('Backreferences are not allowed');
      }
      i += 2;
    } else if (char === '[') {
      i += 1;
      while (i < pattern.length && pattern[i] !== ']') {
        i += pattern[i] === '\\' ? 2 : 1;
      }
      if (i >= pattern.length) {
        throw new Error('Unterminated character class');
      }
      i += 1;
    } else if (char === '(') {
      stack.push({ alternatives: 1, containsVariableQuantifier: false });
      i += 1;
      continue;
    } else if (char === ')') {
      if (stack.length === 1) {
        throw new Error('Unbalanced parenthesis');
      }
      const group = stack.pop() as GroupFrame;
      branchFactors.push(group.alternatives);
      i += 1;
      const quantifier = readQuantifier(pattern, i);
      if (quantifier) {
        applyQuantifier(group, quantifier);
        i += quantifier.length;
      }
      const parent = stack[stack.length - 1];
      parent.containsVariableQuantifier =
        parent.containsVariableQuantifier ||
        group.containsVariableQuantifier ||
        group.alternatives > 1;
      continue;
    } else if (char === '|') {
      stack[stack.length - 1].alternatives += 1;
      i += 1;
      continue;
    } else {
      i += 1;
    }

    const quantifier = readQuantifier(pattern, i);
    if (quantifier) {
      const isVariableQuantifier = applyQuantifier(null, quantifier);
      i += quantifier.length;
      endsWithFreeQuantifier =
        isVariableQuantifier && stack.length === 1 && i === pattern.length;
    }
  }

  if (stack.length !== 1) {
    throw new Error('Unbalanced parenthesis');
  }
  branchFactors.push(stack[0].alternatives);
  if (endsWithFreeQuantifier) {
    quantifiers.pop();
  }

  // An unanchored pattern is retried at every input position.
  const anchored = pattern.startsWith('^') && stack[0].alternatives === 1;

  return { quantifiers, branchFactors, anchored };
};

const estimateBacktrackingCost = (
  quantifiers: QuantifierRange[],
  branchFactors: number[],
  anchored: boolean,
  inputLength: number,
) => {
  let cost = anchored ? 1 : inputLength + 1;
  for (const factor of branchFactors) {
    cost *= factor;
  }
  for (const { min, max } of quantifiers) {
    cost *= Math.max(1, Math.min(max, inputLength) - min + 1);
    if (cost > MAX_DAPP_REGEX_BACKTRACKING_COST) {
      return cost;
    }
  }
  return cost;
};

/**
 * Validates and compiles a regular expression supplied by a dapp (e.g. via
 * `wallet_scanQRCode`). Throws if the pattern is not a short, valid, non
 * catastrophic expression. The returned matcher throws if matching the given
 * input could exceed the backtracking budget.
 */
export const createDappRegexMatcher = (
  pattern: unknown,
): ((input: string) => RegExpExecArray | null) => {
  if (typeof pattern !== 'string') {
    throw new Error('Regular expression must be a string');
  }
  if (pattern.length > MAX_DAPP_REGEX_PATTERN_LENGTH) {
    throw new Error(
      `Regular expression exceeds ${MAX_DAPP_REGEX_PATTERN_LENGTH} characters`,
    );
  }

  let compiled: RegExp;
  try {
    compiled = new RegExp(pattern);
  } catch (error) {
    throw new Error('Invalid regular expression');
  }

  const { quantifiers, branchFactors, anchored } = analysePattern(pattern);

  return (input: string) => {
    if (
      estimateBacktrackingCost(
        quantifiers,
        branchFactors,
        anchored,
        input.length,
      ) > MAX_DAPP_REGEX_BACKTRACKING_COST
    ) {
      throw new Error('Regular expression is too complex for this input');
    }
    return compiled.exec(input);
  };
};
