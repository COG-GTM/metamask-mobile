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
