/**
 * Base URL of a block explorer.
 */


/**
 * Format URL of a block explorer for addresses.
 *
 * The format URLs can be used to "expand" some strings within the format string. (Similar
 * to "string interpolation"). The "tags" are being identified with curly-braces.
 */



/**
 * A group of URL and format URL for block explorers.
 */

















/**
 * Format a URL by replacing a "tag" with a corresponding value.
 *
 * @param url - Format URL.
 * @param tag - Format URL tag.
 * @param value - The value to expand.
 * @returns A formatted URL.
 */
export function formatBlockExplorerUrl(
url,
tag,
value)
{
  return url.replace(new RegExp(`{${tag}}`, 'g'), value);
}

/**
 * Format a URL for addresses.
 *
 * @param urls - The group of format URLs for a given block explorer.
 * @param address - The address to create the URL for.
 * @returns The formatted URL for the given address.
 */
export function formatBlockExplorerAddressUrl(
urls,
address)
{
  return formatBlockExplorerUrl(urls.address, 'address', address);
}

/**
 * Format a URL for transactions.
 *
 * @param urls - The group of format URLs for a given block explorer.
 * @param txId - The transaction ID to create the URL for.
 * @returns The formatted URL for the given transaction.
 */
export function formatBlockExplorerTransactionUrl(
urls,
txId)
{
  return urls.transaction.replace('{txId}', txId);
}