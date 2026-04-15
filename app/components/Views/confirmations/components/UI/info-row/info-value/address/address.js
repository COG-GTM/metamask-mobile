import React from 'react';

import Name from '../../../../../../../UI/Name';
import { NameType } from '../../../../../../../UI/Name/Name.types';






const Address = ({ address, chainId }) =>
<Name type={NameType.EthereumAddress} value={address} variation={chainId} />;


export default Address;