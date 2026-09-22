export interface AbiParameter {
  name: string;
  type: string;
  indexed?: boolean;
}

export interface AbiDefinition {
  name?: string;
  type: string;
  constant?: boolean;
  payable?: boolean;
  anonymous?: boolean;
  stateMutability?: string;
  inputs?: AbiParameter[];
  outputs?: AbiParameter[];
}
