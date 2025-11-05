import React from 'react';
import { NavigationProp, ParamListBase } from '@react-navigation/native';

export interface NavbarTitleProps {
  providerConfig?: object;
  title?: string;
  translate?: boolean;
  disableNetwork?: boolean;
  navigation?: NavigationProp<ParamListBase>;
  metrics?: object;
  showSelectedNetwork?: boolean;
  networkName?: string;
  children?: React.ReactNode;
  chainId?: string;
  selectedNetworkName?: string;
}

declare const NavbarTitle: React.ComponentType<NavbarTitleProps>;
export default NavbarTitle;
