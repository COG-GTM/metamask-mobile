import { Alert, AlertButton, Linking } from 'react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';
import Share from 'react-native-share';
import downloadFile from './downloadFile';
import Device from '../device';

jest.mock('react-native-blob-util', () => ({
  config: jest.fn(),
}));

jest.mock('react-native-share', () => ({
  open: jest.fn(),
}));

jest.mock('../device', () => ({
  isIos: jest.fn(),
}));

const DOWNLOAD_URL = 'https://attacker.example/pass';
const FILE_PATH = '/tmp/pass';

const mockFetchResponse = (contentType: string) => {
  const response = {
    respInfo: { headers: { 'Content-Type': contentType } },
    path: () => FILE_PATH,
    text: () => '',
  };
  (ReactNativeBlobUtil.config as jest.Mock).mockReturnValue({
    fetch: jest.fn().mockResolvedValue(response),
  });
};

const flushPromises = () => new Promise(setImmediate);

describe('downloadFile', () => {
  let alertSpy: jest.SpyInstance;
  let openURLSpy: jest.SpyInstance;

  beforeEach(() => {
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(true);
    openURLSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    (Device.isIos as jest.Mock).mockReturnValue(true);
    (Share.open as jest.Mock).mockResolvedValue({
      success: true,
      message: 'shared',
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  describe('Apple Wallet pass', () => {
    beforeEach(() => {
      mockFetchResponse('application/vnd.apple.pkpass');
    });

    it('asks for consent and does not open the URL when ignored', async () => {
      const resultPromise = downloadFile(DOWNLOAD_URL);
      await flushPromises();

      expect(alertSpy).toHaveBeenCalledTimes(1);
      expect(openURLSpy).not.toHaveBeenCalled();

      (alertSpy.mock.calls[0][2] as AlertButton[])[0].onPress?.();

      expect(await resultPromise).toEqual({
        success: false,
        message: 'cancelled',
      });
      expect(openURLSpy).not.toHaveBeenCalled();
    });

    it('opens the URL only after the user allows it', async () => {
      const resultPromise = downloadFile(DOWNLOAD_URL);
      await flushPromises();

      (alertSpy.mock.calls[0][2] as AlertButton[])[1].onPress?.();

      expect(await resultPromise).toEqual({
        success: true,
        message: 'success',
      });
      expect(openURLSpy).toHaveBeenCalledWith(DOWNLOAD_URL);
    });
  });

  it('shares other downloaded files without prompting', async () => {
    mockFetchResponse('application/pdf');

    expect(await downloadFile(DOWNLOAD_URL)).toEqual({
      success: true,
      message: 'shared',
    });
    expect(alertSpy).not.toHaveBeenCalled();
    expect(openURLSpy).not.toHaveBeenCalled();
    expect(Share.open).toHaveBeenCalledWith(
      expect.objectContaining({ url: FILE_PATH }),
    );
  });
});
