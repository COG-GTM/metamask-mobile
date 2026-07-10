export interface AbiParameter {
  name: string;
  type: string;
  indexed?: boolean;
}

export interface AbiItem {
  constant?: boolean;
  anonymous?: boolean;
  inputs?: AbiParameter[];
  outputs?: AbiParameter[];
  name?: string;
  payable?: boolean;
  stateMutability?: string;
  type: string;
}
