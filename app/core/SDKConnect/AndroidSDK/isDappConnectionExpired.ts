/**
 * Whether a stored dapp connection is no longer valid. Entries without a
 * finite `validUntil` are treated as expired so they require re-approval.
 *
 * @param validUntil - Expiry timestamp (ms since epoch) of the connection.
 * @param now - Current time in ms; defaults to `Date.now()`.
 * @returns True when the connection must not be restored or used.
 */
function isDappConnectionExpired(
  validUntil: number | undefined,
  now: number = Date.now(),
): boolean {
  return (
    typeof validUntil !== 'number' ||
    !Number.isFinite(validUntil) ||
    validUntil <= now
  );
}

export default isDappConnectionExpired;
