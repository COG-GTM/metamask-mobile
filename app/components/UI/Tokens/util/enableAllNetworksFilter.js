







export function enableAllNetworksFilter(
networks)
{
  const allOpts = {};
  Object.keys(networks).forEach((chainId) => {
    const hexChainId = chainId;
    allOpts[hexChainId] = true;
  });
  return allOpts;
}