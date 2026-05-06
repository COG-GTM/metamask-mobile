import { Web3Provider, ExternalProvider } from '@ethersproject/providers';
import { ContractFactory, Contract } from '@ethersproject/contracts';
import { SMART_CONTRACTS, contractConfiguration } from './smart-contracts';
import ContractAddressRegistry from './contract-address-registry';

/*
 * Ganache seeder is used to seed initial smart contract or set initial blockchain state.
 */
class GanacheSeeder {
  smartContractRegistry: ContractAddressRegistry;
  ganacheProvider: ExternalProvider;

  constructor(ganacheProvider: ExternalProvider) {
    this.smartContractRegistry = new ContractAddressRegistry();
    this.ganacheProvider = ganacheProvider;
  }

  /**
   * Deploy initial smart contracts that can be used later within the e2e tests.
   */
  async deploySmartContract(contractName: string): Promise<void> {
    const ethersProvider = new Web3Provider(this.ganacheProvider, 'any');
    const signer = ethersProvider.getSigner();
    const fromAddress = await signer.getAddress();
    const contractFactory = new ContractFactory(
      contractConfiguration[contractName].abi as never,
      contractConfiguration[contractName].bytecode,
      signer,
    );

    let contract: Contract;

    if (contractName === SMART_CONTRACTS.HST) {
      const hstConfig = contractConfiguration[SMART_CONTRACTS.HST];
      contract = await contractFactory.deploy(
        hstConfig.initialAmount,
        hstConfig.tokenName,
        hstConfig.decimalUnits,
        hstConfig.tokenSymbol,
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
   */
  storeSmartContractAddress(
    contractName: string,
    contractAddress: string,
  ): void {
    this.smartContractRegistry.storeNewContractAddress(
      contractName,
      contractAddress,
    );
  }

  /**
   * Return an instance of the currently used smart contract registry.
   */
  getContractRegistry(): ContractAddressRegistry {
    return this.smartContractRegistry;
  }
}

export default GanacheSeeder;
