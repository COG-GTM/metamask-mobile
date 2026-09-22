// Upper bounds for an untrusted, caller-supplied pattern and the string it is
// run against. These keep compilation and matching cheap even for a pattern
// that is not flagged as catastrophic below.
const MAX_PATTERN_LENGTH = 1000;
const MAX_INPUT_LENGTH = 10000;

/**
 * Conservatively detects regular expressions that are prone to catastrophic
 * backtracking (ReDoS). The dominant class of such patterns applies an
 * unbounded quantifier (`*`, `+`, or `{n,}`) to a group that itself contains an
 * unbounded quantifier — e.g. `(a+)+`, `(a*)*`, `((ab)+)+`. Matching those
 * against a non-matching suffix forces exponential backtracking and can freeze
 * the single JS thread.
 *
 * The scan walks the pattern once, tracking group nesting and whether each
 * group's body contains a quantifier, and flags any group that both contains a
 * quantifier and is itself quantified by an unbounded quantifier. It is
 * intentionally conservative: it may over-flag some safe nested-quantifier
 * shapes, which is acceptable for an untrusted, low-value validation regex, but
 * it never runs a flagged pattern.
 */
export function isPotentiallyCatastrophicRegex(pattern: string): boolean {
  // Whether each open group level has seen an (unbounded) quantifier in its body.
  const groupHasQuantifier: boolean[] = [];
  // Whether the group that just closed had a quantifier in its body.
  let lastClosedGroupHadQuantifier = false;

  const markQuantifierAtCurrentLevel = () => {
    if (groupHasQuantifier.length > 0) {
      groupHasQuantifier[groupHasQuantifier.length - 1] = true;
    }
  };

  for (let i = 0; i < pattern.length; i++) {
    const char = pattern[i];

    // Escaped atom — skip the escaped character.
    if (char === '\\') {
      i++;
      lastClosedGroupHadQuantifier = false;
      continue;
    }

    // Character class — skip to the closing (unescaped) `]`.
    if (char === '[') {
      i++;
      while (i < pattern.length && pattern[i] !== ']') {
        if (pattern[i] === '\\') {
          i++;
        }
        i++;
      }
      lastClosedGroupHadQuantifier = false;
      continue;
    }

    if (char === '(') {
      groupHasQuantifier.push(false);
      lastClosedGroupHadQuantifier = false;
      continue;
    }

    if (char === ')') {
      lastClosedGroupHadQuantifier = groupHasQuantifier.pop() ?? false;
      continue;
    }

    const isUnboundedQuantifier =
      char === '*' ||
      char === '+' ||
      // `{n,}` (unbounded upper) or a generic `{...}` repetition.
      (char === '{' && /^\{\d*,?\d*\}/.test(pattern.slice(i)));

    if (isUnboundedQuantifier) {
      // A quantifier applied to a group whose body already contains a
      // quantifier is the catastrophic-backtracking signature.
      if (lastClosedGroupHadQuantifier) {
        return true;
      }
      markQuantifierAtCurrentLevel();
      lastClosedGroupHadQuantifier = false;
      continue;
    }

    // `?` only allows 0/1 repetitions, so it does not create backtracking blowup.
    lastClosedGroupHadQuantifier = false;
  }

  return false;
}

/**
 * Safely runs a caller-supplied regular expression against an input string.
 *
 * The pattern may be fully untrusted (e.g. supplied by a dapp via
 * `wallet_scanQRCode`), so this: rejects over-long patterns, refuses to compile
 * patterns flagged as ReDoS-prone, bounds the input length, and swallows
 * invalid-pattern compile errors. In every rejected case it returns `null`
 * (i.e. "no match"), matching `RegExp.prototype.exec`'s contract, rather than
 * throwing or hanging the JS thread.
 */
export function safeRegexExec(
  exp: string,
  input: string,
): RegExpExecArray | null {
  if (typeof exp !== 'string' || exp.length === 0) {
    return null;
  }

  if (exp.length > MAX_PATTERN_LENGTH) {
    return null;
  }

  if (isPotentiallyCatastrophicRegex(exp)) {
    return null;
  }

  const boundedInput =
    typeof input === 'string' ? input.slice(0, MAX_INPUT_LENGTH) : String(input);

  try {
    return new RegExp(exp).exec(boundedInput);
  } catch {
    return null;
  }
}
