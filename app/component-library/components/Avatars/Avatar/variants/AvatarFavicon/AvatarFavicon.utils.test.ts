import {
  checkSvgContentType,
  clearSvgContentTypeCache,
} from './AvatarFavicon.utils';

const SVG_URI = 'https://example.com/favicon.svg';

const headResponse = (contentType: string) => ({
  ok: true,
  headers: new Headers({ 'Content-Type': contentType }),
});

describe('checkSvgContentType', () => {
  beforeEach(() => {
    clearSvgContentTypeCache();
    global.fetch = jest.fn();
  });

  it('returns true for SVG data URIs without a request', async () => {
    expect(
      await checkSvgContentType('data:image/svg+xml;utf8,%3Csvg%2F%3E'),
    ).toBe(true);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('memoizes the result per URI', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      headResponse('image/svg+xml'),
    );

    const results = await Promise.all([
      checkSvgContentType(SVG_URI),
      checkSvgContentType(SVG_URI),
    ]);
    expect(await checkSvgContentType(SVG_URI)).toBe(true);

    expect(results).toEqual([true, true]);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(SVG_URI, { method: 'HEAD' });
  });

  it('caches non-SVG content types', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(headResponse('text/html'));

    expect(await checkSvgContentType(SVG_URI)).toBe(false);
    expect(await checkSvgContentType(SVG_URI)).toBe(false);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('does not cache failed requests', async () => {
    (global.fetch as jest.Mock)
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce(headResponse('image/svg+xml'));

    expect(await checkSvgContentType(SVG_URI)).toBe(false);
    expect(await checkSvgContentType(SVG_URI)).toBe(true);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('does not cache non-2xx responses', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        headers: new Headers({ 'Content-Type': 'text/html' }),
      })
      .mockResolvedValueOnce(headResponse('image/svg+xml'));

    expect(await checkSvgContentType(SVG_URI)).toBe(false);
    expect(await checkSvgContentType(SVG_URI)).toBe(true);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('checks each URI separately', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      headResponse('image/svg+xml'),
    );

    await checkSvgContentType(SVG_URI);
    await checkSvgContentType('https://other.example/icon.svg');
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
});
