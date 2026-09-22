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
import type { ContractInterface } from '@ethersproject/contracts';

interface ContractConfiguration {
  bytecode: string;
  abi: ContractInterface;
  initialAmount?: number;
  tokenName?: string;
  decimalUnits?: number;
  tokenSymbol?: string;
}

const hstFactory: ContractConfiguration = {
  initialAmount: 100,
  tokenName: 'TST',
  decimalUnits: 4,
  tokenSymbol: 'TST',
  bytecode: hstBytecode,
  abi: hstAbi,
};

const nftsFactory: ContractConfiguration = {
  bytecode: nftsBytecode,
  abi: nftsAbi,
};

const erc1155Factory: ContractConfiguration = {
  bytecode: erc1155Bytecode,
  abi: erc1155Abi,
};

const piggybankFactory: ContractConfiguration = {
  bytecode: piggybankBytecode,
  abi: piggybankAbi,
};

const failingContract: ContractConfiguration = {
  bytecode: failingContractBytecode,
  abi: failingContractAbi,
};

const multisigFactory: ContractConfiguration = {
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

const contractConfiguration: Record<
  (typeof SMART_CONTRACTS)[keyof typeof SMART_CONTRACTS],
  ContractConfiguration
> = {
  [SMART_CONTRACTS.HST]: hstFactory,
  [SMART_CONTRACTS.NFTS]: nftsFactory,
  [SMART_CONTRACTS.ERC1155]: erc1155Factory,
  [SMART_CONTRACTS.PIGGYBANK]: piggybankFactory,
  [SMART_CONTRACTS.FAILING]: failingContract,
  [SMART_CONTRACTS.MULTISIG]: multisigFactory,
};

export { SMART_CONTRACTS, contractConfiguration };
