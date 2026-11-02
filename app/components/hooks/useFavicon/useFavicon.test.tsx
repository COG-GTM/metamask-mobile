import { renderHook, waitFor } from '@testing-library/react-native';
import useFavicon from './useFavicon';
import { resolveFavicon } from '../../../util/favicon';

jest.mock('../../../util/favicon');

describe('useFavicon', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('returns favicon URL', async () => {
    const origin = 'https://metamask.github.io/test-dapp/';
    const expectedURL = 'https://metamask.github.io/test-dapp/favicon.svg';
    (resolveFavicon as jest.Mock).mockResolvedValue(expectedURL);

    const { result } = renderHook(() => useFavicon(origin));

    await waitFor(() => {
      expect(result.current).toEqual({ uri: expectedURL });
    });
    expect(resolveFavicon).toHaveBeenCalledWith(origin);
  });

  it('keeps the empty fallback source when no favicon is resolved', async () => {
    (resolveFavicon as jest.Mock).mockResolvedValue(undefined);

    const { result } = renderHook(() => useFavicon('dapp.test'));

    await waitFor(() => {
      expect(resolveFavicon).toHaveBeenCalledWith('dapp.test');
    });
    expect(result.current).toEqual({});
  });

  it('does not resolve a null origin', () => {
    renderHook(() => useFavicon('null'));

    expect(resolveFavicon).not.toHaveBeenCalled();
  });
});
