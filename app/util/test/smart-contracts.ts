import {
  hstBytecode,
  hstAbi,
  piggybankBytecode,
  piggybankAbi,
  nftsAbi,
  nftsBytecode,
  erc1155Abi,
  erc1155Bytecode,
  failingContractAbi,
  failingContractBytecode,
  multisigAbi,
  multisigBytecode,
} from '@metamask/test-dapp/dist/constants.json';

interface ContractFactoryConfiguration {
  bytecode: string;
  abi: unknown[];
  initialAmount?: number;
  tokenName?: string;
  decimalUnits?: number;
  tokenSymbol?: string;
}

const hstFactory: ContractFactoryConfiguration = {
  initialAmount: 100,
  tokenName: 'TST',
  decimalUnits: 4,
  tokenSymbol: 'TST',
  bytecode: hstBytecode,
  abi: hstAbi,
};

const nftsFactory: ContractFactoryConfiguration = {
  bytecode: nftsBytecode,
  abi: nftsAbi,
};

const erc1155Factory: ContractFactoryConfiguration = {
  bytecode: erc1155Bytecode,
  abi: erc1155Abi,
};

const piggybankFactory: ContractFactoryConfiguration = {
  bytecode: piggybankBytecode,
  abi: piggybankAbi,
};

const failingContract: ContractFactoryConfiguration = {
  bytecode: failingContractBytecode,
  abi: failingContractAbi,
};

const multisigFactory: ContractFactoryConfiguration = {
  bytecode: multisigBytecode,
  abi: multisigAbi,
};

const SMART_CONTRACTS = {
  HST: 'hst',
  NFTS: 'nfts',
  ERC1155: 'erc1155',
  PIGGYBANK: 'piggybank',
  FAILING: 'failing',
  MULTISIG: 'multisig',
};

const contractConfiguration: Record<string, ContractFactoryConfiguration> = {
  [SMART_CONTRACTS.HST]: hstFactory,
  [SMART_CONTRACTS.NFTS]: nftsFactory,
  [SMART_CONTRACTS.ERC1155]: erc1155Factory,
  [SMART_CONTRACTS.PIGGYBANK]: piggybankFactory,
  [SMART_CONTRACTS.FAILING]: failingContract,
  [SMART_CONTRACTS.MULTISIG]: multisigFactory,
};

export { SMART_CONTRACTS, contractConfiguration };
export type { ContractFactoryConfiguration };
