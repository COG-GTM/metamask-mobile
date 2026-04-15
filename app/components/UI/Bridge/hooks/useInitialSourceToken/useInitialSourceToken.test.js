import { renderHookWithProvider } from '../../../../../util/test/renderWithProvider';
import { useInitialSourceToken } from '.';
import { waitFor } from '@testing-library/react-native';
import { initialState } from '../../_mocks_/initialState';
import { BridgeViewMode } from '../../types';
import { useRoute } from '@react-navigation/native';
import { setSourceToken } from '../../../../../core/redux/slices/bridge';
import { selectEvmNetworkConfigurationsByChainId } from '../../../../../selectors/networkController';
import { useNetworkInfo } from '../../../../../selectors/selectedNetworkController';
import { useSwitchNetworks } from '../../../../Views/NetworkSelector/useSwitchNetworks';

import { constants } from 'ethers';
import { getNativeAssetForChainId } from '@metamask/bridge-controller';

// Mock dependencies
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useRoute: jest.fn()
}));

jest.mock('../../../../../core/redux/slices/bridge', () => {
  const actual = jest.requireActual('../../../../../core/redux/slices/bridge');
  return {
    ...actual,
    setSourceToken: jest.fn(actual.setSourceToken)
  };
});

jest.mock('../../../../../selectors/networkController', () => {
  const actual = jest.requireActual('../../../../../selectors/networkController');
  return {
    ...actual,
    selectEvmNetworkConfigurationsByChainId: jest.fn(actual.selectEvmNetworkConfigurationsByChainId)
  };
});

jest.mock('../../../../../selectors/selectedNetworkController', () => {
  const actual = jest.requireActual('../../../../../selectors/selectedNetworkController');
  return {
    ...actual,
    useNetworkInfo: jest.fn(actual.useNetworkInfo)
  };
});

jest.mock('../../../../Views/NetworkSelector/useSwitchNetworks', () => {
  const actual = jest.requireActual('../../../../Views/NetworkSelector/useSwitchNetworks');
  return {
    ...actual,
    useSwitchNetworks: jest.fn(actual.useSwitchNetworks)
  };
});

jest.mock('@metamask/bridge-controller', () => {
  const actual = jest.requireActual('@metamask/bridge-controller');
  return {
    ...actual,
    getNativeAssetForChainId: jest.fn(actual.getNativeAssetForChainId)
  };
});

describe('useInitialSourceToken', () => {
  const mockChainId = '0x1';
  const mockNetworkConfigurations = {
    [mockChainId]: {
      chainId: mockChainId,
      rpcUrl: 'https://mock-rpc-url.com',
      ticker: 'ETH',
      label: 'Ethereum Mainnet'
    }
  };

  const mockNetworkInfo = {
    chainId: mockChainId,
    domainIsConnectedDapp: false,
    networkName: 'Ethereum Mainnet'
  };

  const mockSwitchNetworks = {
    onSetRpcTarget: jest.fn()
  };

  const mockNativeAsset = {
    address: constants.AddressZero,
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock network info
    useNetworkInfo.mockReturnValue(mockNetworkInfo);

    // Mock switch networks
    useSwitchNetworks.mockReturnValue(mockSwitchNetworks);

    // Mock native asset
    getNativeAssetForChainId.mockReturnValue(mockNativeAsset);
  });

  it('should set native token as source token when no initial token is provided', async () => {
    useRoute.mockReturnValue({
      params: {
        bridgeViewMode: BridgeViewMode.Bridge
      }
    });

    renderHookWithProvider(() => useInitialSourceToken(undefined), {
      state: initialState
    });

    await waitFor(() => {
      expect(setSourceToken).toHaveBeenCalledWith({
        address: mockNativeAsset.address,
        name: mockNativeAsset.name,
        symbol: mockNativeAsset.symbol,
        image: '',
        decimals: mockNativeAsset.decimals,
        chainId: mockChainId
      });
    });
  });

  it('should set the provided token as source token when initial token is provided', async () => {
    const mockToken = {
      address: '0x0000000000000000000000000000000000000001',
      symbol: 'TOKEN',
      name: 'Test Token',
      decimals: 18,
      chainId: mockChainId
    };

    useRoute.mockReturnValue({
      params: {
        bridgeViewMode: BridgeViewMode.Swap
      }
    });

    renderHookWithProvider(() => useInitialSourceToken(mockToken), {
      state: initialState
    });

    await waitFor(() => {
      expect(setSourceToken).toHaveBeenCalledWith(mockToken);
    });
  });

  it('should set native token when initial token is the zero address', async () => {
    const mockToken = {
      address: constants.AddressZero,
      symbol: 'ETH',
      name: 'Ethereum',
      decimals: 18,
      chainId: mockChainId
    };

    useRoute.mockReturnValue({
      params: {
        bridgeViewMode: BridgeViewMode.Swap
      }
    });

    renderHookWithProvider(() => useInitialSourceToken(mockToken), {
      state: initialState
    });

    await waitFor(() => {
      expect(setSourceToken).toHaveBeenCalledWith({
        address: mockNativeAsset.address,
        name: mockNativeAsset.name,
        symbol: mockNativeAsset.symbol,
        image: '',
        decimals: mockNativeAsset.decimals,
        chainId: mockChainId
      });
    });
  });

  it('should change network when initial token chainId differs from selected chainId', async () => {
    const differentChainId = '0x2';
    const mockToken = {
      address: '0x0000000000000000000000000000000000000001',
      symbol: 'TOKEN',
      name: 'Test Token',
      decimals: 18,
      chainId: differentChainId
    };

    const updatedNetworkConfigurations = {
      ...mockNetworkConfigurations,
      [differentChainId]: {
        chainId: differentChainId,
        rpcUrl: 'https://different-rpc-url.com',
        ticker: 'TOKEN',
        label: 'Different Network'
      }
    };
    selectEvmNetworkConfigurationsByChainId.mockReturnValue(updatedNetworkConfigurations);

    useRoute.mockReturnValue({
      params: {
        bridgeViewMode: BridgeViewMode.Swap
      }
    });

    renderHookWithProvider(() => useInitialSourceToken(mockToken), {
      state: initialState
    });

    await waitFor(() => {
      expect(setSourceToken).toHaveBeenCalledWith(mockToken);
      expect(mockSwitchNetworks.onSetRpcTarget).toHaveBeenCalledWith(updatedNetworkConfigurations[differentChainId]);
    });
  });

  it('should not change network when initial token chainId matches selected chainId', async () => {
    const mockToken = {
      address: '0x0000000000000000000000000000000000000001',
      symbol: 'TOKEN',
      name: 'Test Token',
      decimals: 18,
      chainId: mockChainId
    };

    useRoute.mockReturnValue({
      params: {
        bridgeViewMode: BridgeViewMode.Swap
      }
    });

    renderHookWithProvider(() => useInitialSourceToken(mockToken), {
      state: initialState
    });

    await waitFor(() => {
      expect(setSourceToken).toHaveBeenCalledWith(mockToken);
      expect(mockSwitchNetworks.onSetRpcTarget).not.toHaveBeenCalled();
    });
  });
});