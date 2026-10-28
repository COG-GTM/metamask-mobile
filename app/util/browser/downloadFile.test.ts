import { Alert, AlertButton, Linking } from 'react-native';
import Share from 'react-native-share';
import ReactNativeBlobUtil from 'react-native-blob-util';
import Device from '../device';
import downloadFile from './downloadFile';

jest.mock('react-native-blob-util', () => ({
  config: jest.fn(),
}));

jest.mock('react-native-share', () => ({
  open: jest.fn(),
}));

jest.mock('../device', () => ({
  isIos: jest.fn(),
}));

const PKPASS = 'application/vnd.apple.pkpass';
const DOWNLOAD_URL = 'https://attacker.example/pass.pkpass';

const mockFetchResponse = (contentType: string) => {
  const mockFetch = jest.fn().mockResolvedValue({
    respInfo: { headers: { 'Content-Type': contentType } },
    path: () => '/tmp/cached-download',
    text: () => '',
  });
  (ReactNativeBlobUtil.config as jest.Mock).mockReturnValue({
    fetch: mockFetch,
  });
  return mockFetch;
};

const pressAlertButton = (style: AlertButton['style']) => {
  const buttons = (Alert.alert as jest.Mock).mock.calls[0][2] as AlertButton[];
  buttons.find((button) => button.style === style)?.onPress?.();
};

describe('downloadFile', () => {
  let openURLSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    openURLSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    (Device.isIos as jest.Mock).mockReturnValue(true);
    (Share.open as jest.Mock).mockResolvedValue({
      success: true,
      message: 'shared',
    });
  });

  describe('Apple Wallet pass on iOS', () => {
    it('asks the user before opening the pass URL outside MetaMask', async () => {
      mockFetchResponse(PKPASS);

      const pending = downloadFile(DOWNLOAD_URL);
      await new Promise(process.nextTick);

      expect(Alert.alert).toHaveBeenCalledTimes(1);
      expect((Alert.alert as jest.Mock).mock.calls[0][1]).toContain(
        'attacker.example',
      );
      expect(openURLSpy).not.toHaveBeenCalled();

      pressAlertButton('default');

      await expect(pending).resolves.toEqual({
        success: true,
        message: 'success',
      });
      expect(openURLSpy).toHaveBeenCalledWith(DOWNLOAD_URL);
    });

    it('does not open the URL when the user ignores the prompt', async () => {
      mockFetchResponse(PKPASS);

      const pending = downloadFile(DOWNLOAD_URL);
      await new Promise(process.nextTick);
      pressAlertButton('cancel');

      const result = await pending;
      expect(result.success).toBe(false);
      expect(openURLSpy).not.toHaveBeenCalled();
      expect(Share.open).not.toHaveBeenCalled();
    });

    it('does not open the URL when the prompt is dismissed', async () => {
      mockFetchResponse(PKPASS);

      const pending = downloadFile(DOWNLOAD_URL);
      await new Promise(process.nextTick);
      (Alert.alert as jest.Mock).mock.calls[0][3].onDismiss();

      expect((await pending).success).toBe(false);
      expect(openURLSpy).not.toHaveBeenCalled();
    });

    it('never hands non-http(s) URLs to the OS', async () => {
      mockFetchResponse(PKPASS);

      const result = await downloadFile('metamask://wc?uri=evil');

      expect(result.success).toBe(false);
      expect(Alert.alert).not.toHaveBeenCalled();
      expect(openURLSpy).not.toHaveBeenCalled();
    });
  });

  it('shares the downloaded file without prompting for other content types', async () => {
    mockFetchResponse('application/pdf');

    const result = await downloadFile(DOWNLOAD_URL);

    expect(result).toEqual({ success: true, message: 'shared' });
    expect(Share.open).toHaveBeenCalledWith(
      expect.objectContaining({ url: '/tmp/cached-download' }),
    );
    expect(Alert.alert).not.toHaveBeenCalled();
    expect(openURLSpy).not.toHaveBeenCalled();
  });

  it('shares pkpass downloads on Android instead of opening the URL', async () => {
    (Device.isIos as jest.Mock).mockReturnValue(false);
    mockFetchResponse(PKPASS);

    await downloadFile(DOWNLOAD_URL);

    expect(Alert.alert).not.toHaveBeenCalled();
    expect(openURLSpy).not.toHaveBeenCalled();
    expect(Share.open).toHaveBeenCalled();
  });
});
