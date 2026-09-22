import { Web3Provider, type ExternalProvider } from '@ethersproject/providers';
import {
  ContractFactory,
  type ContractTransaction,
} from '@ethersproject/contracts';
import { SMART_CONTRACTS, contractConfiguration } from './smart-contracts';
import ContractAddressRegistry from './contract-address-registry';

type SmartContractName =
  (typeof SMART_CONTRACTS)[keyof typeof SMART_CONTRACTS];

interface DeployedContract {
  address: string;
  deployTransaction: ContractTransaction;
  mintNFTs: (
    tokenId: number,
    overrides: { from: string },
  ) => Promise<ContractTransaction>;
  mintBatch: (
    from: string,
    ids: number[],
    amounts: number[],
    data: string,
  ) => Promise<ContractTransaction>;
}

/*
 * Ganache seeder is used to seed initial smart contract or set initial blockchain state.
 */
class GanacheSeeder {
  private smartContractRegistry: ContractAddressRegistry;
  private ganacheProvider: ExternalProvider;

  constructor(ganacheProvider: ExternalProvider) {
    this.smartContractRegistry = new ContractAddressRegistry();
    this.ganacheProvider = ganacheProvider;
  }

  /**
   * Deploy initial smart contracts that can be used later within the e2e tests.
   *
   * @param contractName
   */

  async deploySmartContract(contractName: SmartContractName): Promise<void> {
    const ethersProvider = new Web3Provider(this.ganacheProvider, 'any');
    const signer = ethersProvider.getSigner();
    const fromAddress = await signer.getAddress();
    const contractFactory = new ContractFactory(
      contractConfiguration[contractName].abi,
      contractConfiguration[contractName].bytecode,
      signer,
    );

    let contract: DeployedContract;

    if (contractName === SMART_CONTRACTS.HST) {
      contract = (await contractFactory.deploy(
        contractConfiguration[SMART_CONTRACTS.HST].initialAmount,
        contractConfiguration[SMART_CONTRACTS.HST].tokenName,
        contractConfiguration[SMART_CONTRACTS.HST].decimalUnits,
        contractConfiguration[SMART_CONTRACTS.HST].tokenSymbol,
      )) as unknown as DeployedContract;
    } else {
      contract = (await contractFactory.deploy()) as unknown as DeployedContract;
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
  storeSmartContractAddress(
    contractName: SmartContractName,
    contractAddress: string,
  ): void {
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
