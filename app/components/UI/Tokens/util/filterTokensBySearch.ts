import { TokenI } from '../types';

function normalizeSearchValue(value?: string): string {
  return value?.trim().toLowerCase() ?? '';
}

export function filterTokensBySearch(
  tokens: TokenI[],
  searchQuery: string,
): TokenI[] {
  const normalizedSearchQuery = normalizeSearchValue(searchQuery);

  if (!normalizedSearchQuery) {
    return tokens;
  }

  return tokens.filter((token) =>
    [token.name, token.symbol, token.address].some((value) =>
      normalizeSearchValue(value).includes(normalizedSearchQuery),
    ),
  );
}
