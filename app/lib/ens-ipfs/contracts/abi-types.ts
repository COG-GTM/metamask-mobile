export interface AbiParameter {
  name: string;
  type: string;
  indexed?: boolean;
}

export interface AbiEntry {
  type: 'function' | 'event' | 'constructor';
  name?: string;
  inputs?: AbiParameter[];
  outputs?: AbiParameter[];
  constant?: boolean;
  payable?: boolean;
  anonymous?: boolean;
  stateMutability?: string;
}
