import { generateStateLogs, downloadStateLogs } from '.';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import {
  getApplicationName,
  getBuildNumber,
  getVersion } from
'react-native-device-info';
import Device from '../../util/device';
import Logger from '../../util/Logger';
import initialRootState, {
  backgroundState } from
'../../util/test/initial-root-state';
import { merge } from 'lodash';
import MetaMetrics from '../../core/Analytics/MetaMetrics';

jest.mock('react-native-fs', () => ({
  DocumentDirectoryPath: '/mock/path',
  writeFile: jest.fn()
}));

jest.mock('react-native-share', () => ({
  open: jest.fn()
}));

jest.mock('react-native-device-info', () => ({
  getApplicationName: jest.fn(),
  getBuildNumber: jest.fn(),
  getVersion: jest.fn()
}));

jest.mock('../../util/device', () => ({
  isIos: jest.fn(),
  isAndroid: jest.fn()
}));

jest.mock('../../util/Logger', () => ({
  error: jest.fn()
}));

jest.mock('../../core/Engine', () => ({
  context: {
    KeyringController: {
      state: {
        keyrings: ['keyring1', 'keyring2'],
        isUnlocked: true,
        keyringsMetadata: [
        { id: '123', name: '' },
        { id: '456', name: '' }]

      }
    }
  }
}));

jest.mock('../../core/Analytics/MetaMetrics');

const mockMetrics = {
  isEnabled: jest.fn(() => true),
  getMetaMetricsId: jest.fn(() =>
  Promise.resolve('6D796265-7374-4953-6D65-74616D61736B')
  )
};

MetaMetrics.getInstance.mockReturnValue(mockMetrics);

describe('logs :: generateStateLogs', () => {
  it('generates a valid json export', async () => {
    const mockStateInput = {
      appVersion: '1',
      buildNumber: '123',
      metaMetricsId: '6D796265-7374-4953-6D65-74616D61736B',
      engine: {
        backgroundState: {
          ...backgroundState,
          KeyringController: {
            vault: 'vault mock'
          }
        }
      }
    };
    const logs = generateStateLogs(mockStateInput);

    expect(JSON.parse(logs)).toMatchSnapshot();
  });

  it('generates the expected state logs without the explicitly deleted controller states', async () => {
    const mockStateInput = {
      engine: {
        backgroundState: {
          ...backgroundState,
          KeyringController: {
            vault: 'vault mock'
          }
        }
      }
    };
    const logs = generateStateLogs(mockStateInput);

    expect(logs.includes('NftController')).toBe(false);
    expect(logs.includes('TokensController')).toBe(false);
    expect(logs.includes('AssetsContractController')).toBe(false);
    expect(logs.includes('TokenDetectionController')).toBe(false);
    expect(logs.includes('NftDetectionController')).toBe(false);
    expect(logs.includes('PhishingController')).toBe(false);
    expect(logs.includes("vault: 'vault mock'")).toBe(false);
  });

  it('includes isUnlocked state from KeyringController', () => {
    const mockStateInput = {
      engine: {
        backgroundState: {
          ...backgroundState,
          KeyringController: {
            vault: 'vault mock'
          }
        }
      }
    };
    const logs = generateStateLogs(mockStateInput);
    const parsedLogs = JSON.parse(logs);

    expect(parsedLogs.engine.backgroundState.KeyringController.isUnlocked).toBe(
      true
    );
  });

  it('generates extra logs if values added to the state object parameter', () => {
    const mockStateInput = {
      appVersion: '1',
      buildNumber: '123',
      metaMetricsId: '6D796265-7374-4953-6D65-74616D61736B',
      engine: {
        backgroundState: {
          ...backgroundState,
          KeyringController: {
            vault: 'vault mock'
          }
        }
      }
    };
    const logs = generateStateLogs(mockStateInput);

    expect(logs.includes('NftController')).toBe(false);
    expect(logs.includes('TokensController')).toBe(false);
    expect(logs.includes('AssetsContractController')).toBe(false);
    expect(logs.includes('TokenDetectionController')).toBe(false);
    expect(logs.includes('NftDetectionController')).toBe(false);
    expect(logs.includes('PhishingController')).toBe(false);
    expect(logs.includes("vault: 'vault mock'")).toBe(false);
    expect(logs.includes('appVersion')).toBe(true);
    expect(logs.includes('buildNumber')).toBe(true);
    expect(logs.includes('metaMetricsId')).toBe(true);
  });
});

describe('logs :: downloadStateLogs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should generate and share logs successfully on iOS', async () => {
    getApplicationName.mockResolvedValue('TestApp');
    getVersion.mockResolvedValue('1.0.0');
    getBuildNumber.mockResolvedValue('100');
    Device.isIos.mockReturnValue(true);

    const mockStateInput = merge({}, initialRootState, {
      engine: {
        backgroundState: {
          ...backgroundState,
          KeyringController: {
            vault: 'vault mock'
          }
        }
      }
    });

    await downloadStateLogs(mockStateInput);

    expect(RNFS.writeFile).toHaveBeenCalledWith(
      '/mock/path/state-logs-v1.0.0-(100).json',
      expect.any(String),
      'utf8'
    );
    expect(Share.open).toHaveBeenCalledWith({
      subject: 'TestApp State logs -  v1.0.0 (100)',
      title: 'TestApp State logs -  v1.0.0 (100)',
      url: '/mock/path/state-logs-v1.0.0-(100).json'
    });
  });

  it('should generate and share logs successfully on Android', async () => {
    getApplicationName.mockResolvedValue('TestApp');
    getVersion.mockResolvedValue('1.0.0');
    getBuildNumber.mockResolvedValue('100');
    Device.isIos.mockReturnValue(false);

    const mockStateInput = merge({}, initialRootState, {
      engine: {
        backgroundState: {
          ...backgroundState,
          KeyringController: {
            vault: 'vault mock'
          }
        }
      }
    });

    await downloadStateLogs(mockStateInput);

    expect(RNFS.writeFile).not.toHaveBeenCalled();
    expect(Share.open).toHaveBeenCalledWith({
      subject: 'TestApp State logs -  v1.0.0 (100)',
      title: 'TestApp State logs -  v1.0.0 (100)',
      url: expect.stringContaining('data:text/plain;base64,')
    });
  });

  it('should handle errors during log generation', async () => {
    getApplicationName.mockResolvedValue('TestApp');
    getVersion.mockResolvedValue('1.0.0');
    getBuildNumber.mockResolvedValue('100');
    Device.isIos.mockReturnValue(true);

    const mockStateInput = null;

    //@ts-expect-error - the test case is to test the input being not the expected
    await downloadStateLogs(mockStateInput);

    expect(Logger.error).toHaveBeenCalledWith(
      expect.any(Error),
      'State log error'
    );
  });

  it('should handle errors during file writing on iOS', async () => {
    getApplicationName.mockResolvedValue('TestApp');
    getVersion.mockResolvedValue('1.0.0');
    getBuildNumber.mockResolvedValue('100');
    Device.isIos.mockReturnValue(true);
    RNFS.writeFile.mockRejectedValue(
      new Error('File write error')
    );

    const mockStateInput = merge({}, initialRootState, {
      engine: {
        backgroundState: {
          ...backgroundState,
          KeyringController: {
            vault: 'vault mock'
          }
        }
      }
    });

    await downloadStateLogs(mockStateInput);

    expect(Logger.error).toHaveBeenCalledWith(
      expect.any(Error),
      'State log error'
    );
  });

  it('should handle errors during sharing', async () => {
    getApplicationName.mockResolvedValue('TestApp');
    getVersion.mockResolvedValue('1.0.0');
    getBuildNumber.mockResolvedValue('100');
    Device.isIos.mockReturnValue(false);
    Share.open.mockRejectedValue(new Error('Share error'));

    const mockStateInput = merge({}, initialRootState, {
      engine: {
        backgroundState: {
          ...backgroundState,
          KeyringController: {
            vault: 'vault mock'
          }
        }
      }
    });

    await downloadStateLogs(mockStateInput);

    expect(Logger.error).toHaveBeenCalledWith(
      expect.any(Error),
      'State log error'
    );
  });

  it('should handle loggedIn as false', async () => {
    getApplicationName.mockResolvedValue('TestApp');
    getVersion.mockResolvedValue('1.0.0');
    getBuildNumber.mockResolvedValue('100');
    Device.isIos.mockReturnValue(false);

    const mockStateInput = merge({}, initialRootState, {
      engine: {
        backgroundState: {
          ...backgroundState,
          KeyringController: {
            vault: 'vault mock'
          }
        }
      }
    });

    await downloadStateLogs(mockStateInput, false);

    expect(Share.open).toHaveBeenCalledWith({
      subject: 'TestApp State logs -  v1.0.0 (100)',
      title: 'TestApp State logs -  v1.0.0 (100)',
      url: expect.stringContaining('data:text/plain;base64,')
    });
  });

  it('does not include metametrics id if not opt-in', async () => {
    getApplicationName.mockResolvedValue('TestApp');
    getVersion.mockResolvedValue('1.0.0');
    getBuildNumber.mockResolvedValue('100');
    Device.isIos.mockReturnValue(false);
    mockMetrics.isEnabled.mockReturnValue(false);

    const mockStateInput = merge({}, initialRootState, {
      engine: {
        backgroundState: {
          ...backgroundState,
          KeyringController: {
            vault: 'vault mock'
          }
        }
      }
    });

    await downloadStateLogs(mockStateInput);

    expect(Share.open).toHaveBeenCalledWith({
      subject: 'TestApp State logs -  v1.0.0 (100)',
      title: 'TestApp State logs -  v1.0.0 (100)',
      url: expect.stringContaining('data:text/plain;base64,')
    });

    // Access the arguments passed to Share.open
    const shareOpenCalls = Share.open.mock.calls;
    expect(shareOpenCalls.length).toBeGreaterThan(0);
    const [shareOpenArgs] = shareOpenCalls[0];
    const { url } = shareOpenArgs;
    const base64Data = url.replace('data:text/plain;base64,', '');
    const decodedData = Buffer.from(base64Data, 'base64').toString('utf-8');
    const jsonData = JSON.parse(decodedData);
    expect(jsonData).not.toHaveProperty('metaMetricsId');
  });
});