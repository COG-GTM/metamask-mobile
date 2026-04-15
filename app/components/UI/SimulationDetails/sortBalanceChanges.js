import { AssetType } from './types';

/** Comparator function for comparing two BalanceChange objects. */


/** Order of token standards for comparison. */
const assetTypeOrder = [
AssetType.Native,
AssetType.ERC20,
AssetType.ERC721,
AssetType.ERC1155];


// Compares BalanceChange objects based on token standard.
const byTokenStandard = (a, b) => {
  const indexA = assetTypeOrder.indexOf(a.asset.type);
  const indexB = assetTypeOrder.indexOf(b.asset.type);
  return indexA - indexB;
};

/** Array of comparator functions for BalanceChange objects. */
const comparators = [byTokenStandard];

/**
 * Compares BalanceChange objects based on multiple criteria.
 *
 * @param a
 * @param b
 */
export const compareBalanceChanges = (a, b) => {
  for (const comparator of comparators) {
    const result = comparator(a, b);
    if (result !== 0) {
      return result;
    }
  }
  return 0;
};

/**
 * Sorts an array of balance changes based on multiple criteria
 *
 * @param balanceChanges
 */
export const sortBalanceChanges = (
balanceChanges) =>
[...balanceChanges].sort(compareBalanceChanges);