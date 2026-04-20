import { renderHookWithProvider } from '../../../../util/test/renderWithProvider';
import useGoToPortfolioBridge from './useGoToPortfolioBridge';
import AppConstants from '../../../../core/AppConstants';
import Routes from '../../../../constants/navigation/Routes';

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: mockNavigate }),
}));

const mockTrackEvent = jest.fn();
const mockCreateEventBuilder = jest.fn(() => ({
  addProperties: jest.fn().mockReturnThis(),
  build: jest.fn(() => ({})),
}));
jest.mock('../../../hooks/useMetrics', () => ({
  useMetrics: () => ({
    trackEvent: mockTrackEvent,
    createEventBuilder: mockCreateEventBuilder,
  }),
}));

const getInitialState = (browserTabs: { id: string; url: string }[] = []) => ({
  browser: { tabs: browserTabs },
  engine: {
    backgroundState: {
      NetworkController: {
        selectedNetworkClientId: 'mainnet',
        networkConfigurationsByChainId: {
          '0x1': {
            chainId: '0x1',
            rpcEndpoints: [
              { networkClientId: 'mainnet', url: 'https://mainnet.rpc' },
            ],
            defaultRpcEndpointIndex: 0,
          },
        },
      },
    },
  },
});

describe('useGoToPortfolioBridge', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('opens a new browser tab with the bridge URL when no bridge tab exists', () => {
    const { result } = renderHookWithProvider(
      () => useGoToPortfolioBridge('TabBar'),
      { state: getInitialState() as unknown as Record<string, unknown> },
    );

    result.current();

    expect(mockNavigate).toHaveBeenCalledWith(
      Routes.BROWSER.HOME,
      expect.objectContaining({
        screen: Routes.BROWSER.VIEW,
        params: expect.objectContaining({
          newTabUrl: expect.stringContaining(AppConstants.BRIDGE.URL),
        }),
      }),
    );
    expect(mockTrackEvent).toHaveBeenCalled();
  });

  it('appends token address query param when an address is provided', () => {
    const { result } = renderHookWithProvider(
      () => useGoToPortfolioBridge('TokenOverview'),
      { state: getInitialState() as unknown as Record<string, unknown> },
    );

    result.current('0xabc');

    const call = mockNavigate.mock.calls[0][1];
    expect(call.params.newTabUrl).toContain('&token=0xabc');
  });

  it('reuses an existing bridge tab when one exists', () => {
    const existingTab = {
      id: 'bridge-tab-1',
      url: `${AppConstants.BRIDGE.URL}/?foo=bar`,
    };
    const { result } = renderHookWithProvider(
      () => useGoToPortfolioBridge('TabBar'),
      {
        state: getInitialState([existingTab]) as unknown as Record<
          string,
          unknown
        >,
      },
    );

    result.current();

    const call = mockNavigate.mock.calls[0][1];
    expect(call.params.existingTabId).toBe(existingTab.id);
    expect(call.params.newTabUrl).toBeUndefined();
  });
});
