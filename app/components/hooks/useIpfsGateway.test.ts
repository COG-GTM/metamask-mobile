import { renderHook } from '@testing-library/react-hooks';
import useIpfsGateway from './useIpfsGateway';
import AppConstants from '../../core/AppConstants';

const mockUseSelector = jest.fn();

jest.mock('react-redux', () => ({
  useSelector: (selector: unknown) => mockUseSelector(selector),
}));

jest.mock('../../selectors/preferencesController', () => ({
  selectIpfsGateway: jest.fn(),
}));

describe('useIpfsGateway', () => {
  beforeEach(() => {
    mockUseSelector.mockReset();
  });

  it('returns the selected IPFS gateway when set', () => {
    mockUseSelector.mockReturnValue('https://custom.example/ipfs/');
    const { result } = renderHook(() => useIpfsGateway());
    expect(result.current).toBe('https://custom.example/ipfs/');
  });

  it('falls back to the default IPFS gateway when not set', () => {
    mockUseSelector.mockReturnValue(undefined);
    const { result } = renderHook(() => useIpfsGateway());
    expect(result.current).toBe(AppConstants.IPFS_DEFAULT_GATEWAY_URL);
  });
});
