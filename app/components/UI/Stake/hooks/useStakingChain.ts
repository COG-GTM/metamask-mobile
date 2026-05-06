import { CaipChainId, Hex } from '@metamask/utils';
import { useSelector } from 'react-redux';
import { getDecimalChainId } from '../../../../util/networks';
import { selectEvmChainId } from '../../../../selectors/networkController';
import { ChainId, isSupportedChain } from '@metamask/stake-sdk';

const useStakingChain = () => {
  const chainId = useSelector(selectEvmChainId);

  const isStakingSupportedChain = isSupportedChain(
    getDecimalChainId(chainId) as unknown as ChainId,
  );

  return {
    isStakingSupportedChain,
  };
};

export const useStakingChainByChainId = (chainId: Hex | CaipChainId) => {
  const isStakingSupportedChain = isSupportedChain(
    getDecimalChainId(chainId) as unknown as ChainId,
  );

  return {
    isStakingSupportedChain,
  };
};

export default useStakingChain;
