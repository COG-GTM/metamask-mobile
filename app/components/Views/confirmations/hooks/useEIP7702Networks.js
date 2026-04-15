

import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import Engine from '../../../../core/Engine';
import { TESTNET_CHAIN_IDS } from '../../../../util/networks';
import { selectNetworkConfigurations } from '../../../../selectors/networkController';
import { useAsyncResultOrThrow } from '../../../hooks/useAsyncResult';






export const useEIP7702Networks = (address) => {
  const networks = useSelector(selectNetworkConfigurations);

  const [nonTestNetworks, testNetworks] = useMemo(
    () =>
    Object.entries(networks).reduce(
      ([nonTestnetsList, testnetsList], [chainId, network]) => {
        try {
          const isTest = TESTNET_CHAIN_IDS.includes(chainId);
          (isTest ? testnetsList : nonTestnetsList)[chainId] = network;
        } catch (err) {

          // console.log(err);
        }return [nonTestnetsList, testnetsList];
      },
      [
      {},
      {}]

    ),
    [networks]
  );
  const networkList = useMemo(
    () => ({ ...nonTestNetworks, ...testNetworks }),
    [nonTestNetworks, testNetworks]
  );

  const { pending, value } = useAsyncResultOrThrow(async () => {
    const chainIds = Object.keys(networkList);

    return await Engine.context.TransactionController.isAtomicBatchSupported({
      address: address,
      chainIds
    });
  }, [address, networkList]);

  const network7702List =
  useMemo(() => {
    if (!value) {
      return [];
    }
    const networksSupporting7702 = [];
    Object.values(networkList).forEach((network) => {
      try {
        const atomicBatchResult = value.find(
          ({ chainId }) => chainId === network.chainId
        );
        if (atomicBatchResult) {
          networksSupporting7702.push({
            ...atomicBatchResult,
            ...network
          });
        }
      } catch (err) {

        // console.log(err);
      }});

    return networksSupporting7702;
  }, [networkList, value]);

  return {
    network7702List,
    networkSupporting7702Present: network7702List?.length > 0,
    pending
  };
};