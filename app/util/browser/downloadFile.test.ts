import { Linking } from 'react-native';
import Share from 'react-native-share';
import ReactNativeBlobUtil from 'react-native-blob-util';
import Device from '../device';
import downloadFile from './downloadFile';

jest.mock('react-native-share', () => ({
  __esModule: true,
  default: { open: jest.fn() },
}));

jest.mock('react-native-blob-util', () => ({
  __esModule: true,
  default: {
    config: jest.fn(),
  },
}));

jest.mock('../device', () => ({
  __esModule: true,
  default: { isIos: jest.fn(() => false) },
}));

jest.mock('react-native/Libraries/Linking/Linking', () => ({
  openURL: jest.fn(),
}));

const makeResponse = (overrides: Record<string, unknown> = {}) => ({
  respInfo: { headers: { 'Content-Type': 'image/png' } },
  path: () => '/tmp/file.png',
  text: () => 'text',
  ...overrides,
});

describe('downloadFile', () => {
  const mockedConfig = ReactNativeBlobUtil.config as jest.Mock;
  const mockedShareOpen = Share.open as jest.Mock;
  const mockedIsIos = Device.isIos as jest.Mock;
  const mockedOpenUrl = Linking.openURL as jest.Mock;

  beforeEach(() => {
    mockedConfig.mockReset();
    mockedShareOpen.mockReset();
    mockedIsIos.mockReset();
    mockedOpenUrl.mockReset();
  });

  it('opens Apple Wallet passes via deep link on iOS', async () => {
    mockedIsIos.mockReturnValue(true);
    mockedConfig.mockReturnValue({
      fetch: jest.fn().mockResolvedValue(
        makeResponse({
          respInfo: {
            headers: { 'Content-Type': 'application/vnd.apple.pkpass' },
          },
        }),
      ),
    });
    mockedOpenUrl.mockResolvedValue(undefined);

    const result = await downloadFile('https://a.io/pass.pkpass');

    expect(mockedOpenUrl).toHaveBeenCalledWith('https://a.io/pass.pkpass');
    expect(result).toEqual({ success: true, message: 'success' });
  });

  it('shares the downloaded file when a path is available', async () => {
    mockedConfig.mockReturnValue({
      fetch: jest.fn().mockResolvedValue(makeResponse()),
    });
    mockedShareOpen.mockResolvedValue({ success: true, message: 'shared' });

    const result = await downloadFile('https://a.io/img.png');

    expect(mockedShareOpen).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/tmp/file.png',
        saveToFiles: true,
        failOnCancel: false,
      }),
    );
    expect(result).toEqual({ success: true, message: 'shared' });
  });

  it('returns a failure result with the error message when sharing throws', async () => {
    mockedConfig.mockReturnValue({
      fetch: jest.fn().mockResolvedValue(makeResponse()),
    });
    mockedShareOpen.mockRejectedValue(new Error('nope'));

    const result = await downloadFile('https://a.io/img.png');

    expect(result).toEqual({ success: false, message: 'nope' });
  });

  it('falls back to response.text() when no path is returned', async () => {
    mockedConfig.mockReturnValue({
      fetch: jest.fn().mockResolvedValue(makeResponse({ path: () => null })),
    });

    const result = await downloadFile('https://a.io/img.png');

    expect(result).toEqual({ success: false, message: 'text' });
  });
});
