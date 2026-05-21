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

interface ContractConfig {
  bytecode: string;
  abi: unknown[];
  initialAmount?: number;
  tokenName?: string;
  decimalUnits?: number;
  tokenSymbol?: string;
}

const hstFactory: ContractConfig = {
  initialAmount: 100,
  tokenName: 'TST',
  decimalUnits: 4,
  tokenSymbol: 'TST',
  bytecode: hstBytecode,
  abi: hstAbi,
};

const nftsFactory: ContractConfig = {
  bytecode: nftsBytecode,
  abi: nftsAbi,
};

const erc1155Factory: ContractConfig = {
  bytecode: erc1155Bytecode,
  abi: erc1155Abi,
};

const piggybankFactory: ContractConfig = {
  bytecode: piggybankBytecode,
  abi: piggybankAbi,
};

const failingContract: ContractConfig = {
  bytecode: failingContractBytecode,
  abi: failingContractAbi,
};

const multisigFactory: ContractConfig = {
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

const contractConfiguration: Record<string, ContractConfig> = {
  [SMART_CONTRACTS.HST]: hstFactory,
  [SMART_CONTRACTS.NFTS]: nftsFactory,
  [SMART_CONTRACTS.ERC1155]: erc1155Factory,
  [SMART_CONTRACTS.PIGGYBANK]: piggybankFactory,
  [SMART_CONTRACTS.FAILING]: failingContract,
  [SMART_CONTRACTS.MULTISIG]: multisigFactory,
};

export { SMART_CONTRACTS, contractConfiguration };
