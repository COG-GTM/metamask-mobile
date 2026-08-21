export interface AbiParameter {
  name: string;
  type: string;
  indexed?: boolean;
}

export interface AbiItem {
  type: 'function' | 'event' | 'constructor';
  name?: string;
  inputs: AbiParameter[];
  outputs?: AbiParameter[];
  constant?: boolean;
  payable?: boolean;
  anonymous?: boolean;
  stateMutability?: string;
}

export type ContractAbi = AbiItem[];
