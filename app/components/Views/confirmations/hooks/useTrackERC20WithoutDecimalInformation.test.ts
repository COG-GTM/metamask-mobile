import { renderHook } from '@testing-library/react-hooks';

import { MetaMetricsEvents } from '../../../../core/Analytics';
import { TokenStandard } from '../../../../components/UI/SimulationDetails/types';
import { useMetrics } from '../../../../components/hooks/useMetrics';
import useTrackERC20WithoutDecimalInformation from './useTrackERC20WithoutDecimalInformation';

jest.mock('../../../../components/hooks/useMetrics');

const CHAIN_ID = '0x1' as const;
const TOKEN_ADDRESS = '0x0000000000000000000000000000000000000001';

describe('useTrackERC20WithoutDecimalInformation', () => {
  const mockAddProperties = jest.fn();
  const mockBuild = jest.fn();
  const mockCreateEventBuilder = jest.fn();
  const mockTrackEvent = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockBuild.mockReturnValue({ built: true });
    mockAddProperties.mockReturnValue({ build: mockBuild });
    mockCreateEventBuilder.mockReturnValue({ addProperties: mockAddProperties });

    (useMetrics as jest.Mock).mockReturnValue({
      createEventBuilder: mockCreateEventBuilder,
      trackEvent: mockTrackEvent,
    });
  });

  it('does not track when tokenDetails is undefined', () => {
    renderHook(() =>
      useTrackERC20WithoutDecimalInformation(CHAIN_ID, TOKEN_ADDRESS, undefined),
    );

    expect(mockTrackEvent).not.toHaveBeenCalled();
  });

  it('does not track for non-ERC20 token standards', () => {
    renderHook(() =>
      useTrackERC20WithoutDecimalInformation(CHAIN_ID, TOKEN_ADDRESS, {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        standard: TokenStandard.ERC721 as any,
        decimals: undefined,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any),
    );

    expect(mockTrackEvent).not.toHaveBeenCalled();
  });

  it('does not track when ERC20 decimals are present', () => {
    renderHook(() =>
      useTrackERC20WithoutDecimalInformation(CHAIN_ID, TOKEN_ADDRESS, {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        standard: TokenStandard.ERC20 as any,
        decimals: '18',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any),
    );

    expect(mockTrackEvent).not.toHaveBeenCalled();
  });

  it('tracks an INCOMPLETE_ASSET_DISPLAYED event when ERC20 decimals are missing', () => {
    renderHook(() =>
      useTrackERC20WithoutDecimalInformation(CHAIN_ID, TOKEN_ADDRESS, {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        standard: TokenStandard.ERC20 as any,
        decimals: undefined,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any),
    );

    expect(mockCreateEventBuilder).toHaveBeenCalledWith(
      MetaMetricsEvents.INCOMPLETE_ASSET_DISPLAYED,
    );
    expect(mockAddProperties).toHaveBeenCalledWith({
      token_decimals_available: false,
      asset_address: TOKEN_ADDRESS,
      asset_type: TokenStandard.ERC20,
      chain_id: CHAIN_ID,
      location: 'signature_confirmation',
      ui_customizations: ['redesigned_confirmation'],
    });
    expect(mockTrackEvent).toHaveBeenCalledWith({ built: true });
  });

  it('uses the caller-supplied metricLocation when provided', () => {
    renderHook(() =>
      useTrackERC20WithoutDecimalInformation(
        CHAIN_ID,
        TOKEN_ADDRESS,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { standard: TokenStandard.ERC20 as any, decimals: undefined } as any,
        'transaction_confirmation',
      ),
    );

    expect(mockAddProperties).toHaveBeenCalledWith(
      expect.objectContaining({ location: 'transaction_confirmation' }),
    );
  });
});
