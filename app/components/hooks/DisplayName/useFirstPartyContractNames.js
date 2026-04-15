
import FIRST_PARTY_CONTRACT_NAMES from '../../../constants/first-party-contracts';

import { NameType } from '../../UI/Name/Name.types';

export function useFirstPartyContractNames(
requests)
{
  return requests.map((request) => {
    const { type, variation } = request;

    if (type !== NameType.EthereumAddress) {
      return null;
    }

    const chainId = variation;
    const normalizedValue = request.value.toLowerCase();
    const contractNames = Object.keys(FIRST_PARTY_CONTRACT_NAMES);

    const name = contractNames.find(
      (contractName) =>
      FIRST_PARTY_CONTRACT_NAMES[contractName]?.[chainId]?.toLowerCase() ===
      normalizedValue
    );

    return name ?? null;
  });
}