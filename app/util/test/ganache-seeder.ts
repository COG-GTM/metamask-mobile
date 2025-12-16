import { Web3Provider } from '@ethersproject/providers';
import { ContractFactory, Contract } from '@ethersproject/contracts';
import { SMART_CONTRACTS, contractConfiguration } from './smart-contracts';
import ContractAddressRegistry from './contract-address-registry';

type SmartContractName = typeof SMART_CONTRACTS[keyof typeof SMART_CONTRACTS];

interface GanacheProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
}

/*
 * Ganache seeder is used to seed initial smart contract or set initial blockchain state.
 */
class GanacheSeeder {
  private smartContractRegistry: ContractAddressRegistry;
  private ganacheProvider: GanacheProvider;

  constructor(ganacheProvider: GanacheProvider) {
    this.smartContractRegistry = new ContractAddressRegistry();
    this.ganacheProvider = ganacheProvider;
  }

  /**
   * Deploy initial smart contracts that can be used later within the e2e tests.
   *
   * @param contractName
   */

  async deploySmartContract(contractName: SmartContractName): Promise<void> {
    const ethersProvider = new Web3Provider(this.ganacheProvider as unknown as Parameters<typeof Web3Provider>[0], 'any');
    const signer = ethersProvider.getSigner();
    const fromAddress = await signer.getAddress();
    const contractFactory = new ContractFactory(
      contractConfiguration[contractName].abi,
      contractConfiguration[contractName].bytecode,
      signer,
    );

    let contract: Contract;

    if (contractName === SMART_CONTRACTS.HST) {
      contract = await contractFactory.deploy(
        contractConfiguration[SMART_CONTRACTS.HST].initialAmount,
        contractConfiguration[SMART_CONTRACTS.HST].tokenName,
        contractConfiguration[SMART_CONTRACTS.HST].decimalUnits,
        contractConfiguration[SMART_CONTRACTS.HST].tokenSymbol,
      );
    } else {
      contract = await contractFactory.deploy();
    }

    await contract.deployTransaction.wait();

    if (contractName === SMART_CONTRACTS.NFTS) {
      const transaction = await contract.mintNFTs(1, {
        from: fromAddress,
      });
      await transaction.wait();
    }

    if (contractName === SMART_CONTRACTS.ERC1155) {
      const transaction = await contract.mintBatch(
        fromAddress,
        [1, 2, 3],
        [1, 1, 100000000000000],
        '0x',
      );
      await transaction.wait();
    }
    this.storeSmartContractAddress(contractName, contract.address);
  }

  /**
   * Store deployed smart contract address within the environment variables
   * to make it available everywhere.
   *
   * @param contractName
   * @param contractAddress
   */
  storeSmartContractAddress(contractName: SmartContractName, contractAddress: string): void {
    this.smartContractRegistry.storeNewContractAddress(
      contractName,
      contractAddress,
    );
  }

  /**
   * Return an instance of the currently used smart contract registry.
   *
   * @returns ContractAddressRegistry
   */
  getContractRegistry(): ContractAddressRegistry {
    return this.smartContractRegistry;
  }
}

export default GanacheSeeder;
