import { renderHook, waitFor } from '@testing-library/react-native';
import useSvgUriViewBox from './useSvgUriViewBox';

describe('useSvgUriViewBox()', () => {
  const SAFE_URI = 'https://example.com/icon.svg';
  const MOCK_SVG_WITH_VIEWBOX = `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60" fill="none"></svg>`;
  const MOCK_SVG_WITHOUT_VIEWBOX = `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" fill="none"></svg>`;

  function arrangeMocks(contentType = 'image/svg+xml') {
    const mockResponseTextFn = jest
      .fn()
      .mockResolvedValue(MOCK_SVG_WITHOUT_VIEWBOX);
    const mockFetch = jest.spyOn(global, 'fetch').mockResolvedValue({
      headers: { get: () => contentType },
      text: mockResponseTextFn,
    } as unknown as Response);

    return { mockText: mockResponseTextFn, mockFetch };
  }

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return view-box if svg if missing a view-box', async () => {
    const { mockText } = arrangeMocks();
    mockText.mockResolvedValueOnce(MOCK_SVG_WITHOUT_VIEWBOX);

    const hook = renderHook(() => useSvgUriViewBox(SAFE_URI, true));
    await waitFor(() => expect(hook.result.current).toBeDefined());
  });

  it('should return view-box if svg already has view-box', async () => {
    const { mockText } = arrangeMocks();
    mockText.mockResolvedValueOnce(MOCK_SVG_WITH_VIEWBOX);

    const hook = renderHook(() => useSvgUriViewBox(SAFE_URI, true));
    await waitFor(() => expect(hook.result.current).toBeDefined());
  });

  it('should not make async calls if image is not an svg', async () => {
    const mocks = arrangeMocks();
    const hook = renderHook(() => useSvgUriViewBox(SAFE_URI, false));

    await waitFor(() => expect(hook.result.current).toBeUndefined());
    expect(mocks.mockText).not.toHaveBeenCalled();
  });

  it('should not fetch when the uri targets a non-public host', async () => {
    const mocks = arrangeMocks();
    const hook = renderHook(() =>
      useSvgUriViewBox('http://127.0.0.1/icon.svg', true),
    );

    await waitFor(() => expect(hook.result.current).toBeUndefined());
    expect(mocks.mockFetch).not.toHaveBeenCalled();
  });

  it('should not fetch when the uri uses a file scheme', async () => {
    const mocks = arrangeMocks();
    const hook = renderHook(() =>
      useSvgUriViewBox('file:///etc/passwd', true),
    );

    await waitFor(() => expect(hook.result.current).toBeUndefined());
    expect(mocks.mockFetch).not.toHaveBeenCalled();
  });

  it('should not set a view-box when the response content-type is disallowed', async () => {
    arrangeMocks('text/html');
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    const hook = renderHook(() => useSvgUriViewBox(SAFE_URI, true));

    await waitFor(() => expect(consoleErrorSpy).toHaveBeenCalled());
    expect(hook.result.current).toBeUndefined();
  });
});
