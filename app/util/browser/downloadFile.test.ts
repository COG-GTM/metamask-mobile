import downloadFile from './downloadFile';

jest.mock('react-native-share', () => ({
  open: jest.fn().mockResolvedValue({ success: true, message: 'shared' }),
}));

jest.mock('react-native-blob-util', () => ({
  __esModule: true,
  default: {
    config: jest.fn(() => ({
      fetch: jest.fn().mockResolvedValue({
        path: () => '/tmp/test-file',
        respInfo: { headers: {} },
        text: () => 'error',
      }),
    })),
  },
}));

jest.mock('../device', () => ({
  isIos: jest.fn().mockReturnValue(false),
}));

jest.mock('../../../locales/i18n', () => ({
  strings: jest.fn((key) => key),
}));

describe('downloadFile', () => {
  it('should be a function', () => {
    expect(typeof downloadFile).toBe('function');
  });
});
