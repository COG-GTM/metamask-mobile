import {
  PermissionSource,
  PermissionListItemViewModel,
} from './PermissionItem.types';

const mockedPermissions: PermissionListItemViewModel[] = [
  {
    dappLogoUrl: 'https://uniswap.org/logo.png',
    dappHostName: 'uniswap.org',
    numberOfAccountPermissions: 5,
    numberOfNetworkPermissions: 2,
    permissionSource: PermissionSource.WalletConnect,
  },
  {
    dappLogoUrl: 'https://uniswap.org/logo.png',
    dappHostName: 'uniswap.org',
    numberOfAccountPermissions: 3,
    numberOfNetworkPermissions: 1,
    permissionSource: PermissionSource.SDK,
  },
  {
    dappLogoUrl: 'https://uniswap.org/logo.png',
    dappHostName: 'uniswap.org',
    numberOfAccountPermissions: 4,
    numberOfNetworkPermissions: 3,
    permissionSource: PermissionSource.MetaMaskBrowser,
  },
  {
    dappLogoUrl: 'https://pancakeswap.finance/logo.png',
    dappHostName: 'pancakeswap.finance',
    numberOfAccountPermissions: 6,
    numberOfNetworkPermissions: 2,
    permissionSource: PermissionSource.WalletConnect,
  },
  {
    dappLogoUrl: 'https://pancakeswap.finance/logo.png',
    dappHostName: 'pancakeswap.finance',
    numberOfAccountPermissions: 2,
    numberOfNetworkPermissions: 1,
    permissionSource: PermissionSource.SDK,
  },
  {
    dappLogoUrl: 'https://pancakeswap.finance/logo.png',
    dappHostName: 'pancakeswap.finance',
    numberOfAccountPermissions: 5,
    numberOfNetworkPermissions: 3,
    permissionSource: PermissionSource.MetaMaskBrowser,
  },
];

export default mockedPermissions;
