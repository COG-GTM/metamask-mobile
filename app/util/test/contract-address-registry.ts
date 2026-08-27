/*
 * Use this class to store pre-deployed smart contract addresses of the contracts deployed to
 * a local blockchain instance.
 */
class ContractAddressRegistry {
  #addresses = {};

  /**
   * Store new contract address in key:value pair.
   *
   * @param contractName
   * @param contractAddress
   */
// @ts-expect-error -- legacy JavaScript UI type boundary
  storeNewContractAddress(contractName, contractAddress) {
// @ts-expect-error -- legacy JavaScript UI type boundary
    this.#addresses[contractName] = contractAddress;
  }

  /**
   * Get deployed contract address by its name (key).
   *
   * @param contractName
   */
// @ts-expect-error -- legacy JavaScript UI type boundary
  getContractAddress(contractName) {
// @ts-expect-error -- legacy JavaScript UI type boundary
    return this.#addresses[contractName];
  }
}

export default ContractAddressRegistry;
