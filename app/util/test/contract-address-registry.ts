/**
 * Use this class to store pre-deployed smart contract addresses of the contracts deployed to
 * a local blockchain instance.
 */
class ContractAddressRegistry {
  #addresses: Record<string, string> = {};

  /**
   * Store new contract address in key:value pair.
   *
   * @param contractName - The name of the contract to store
   * @param contractAddress - The address of the deployed contract
   */
  storeNewContractAddress(contractName: string, contractAddress: string): void {
    this.#addresses[contractName] = contractAddress;
  }

  /**
   * Get deployed contract address by its name (key).
   *
   * @param contractName - The name of the contract to retrieve
   * @returns The contract address or undefined if not found
   */
  getContractAddress(contractName: string): string | undefined {
    return this.#addresses[contractName];
  }
}

export default ContractAddressRegistry;
