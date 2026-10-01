import migrate, { controllerList } from './028';
import { hasProperty, isObject } from '@metamask/utils';
import { captureException } from '@sentry/react-native';
import { deepJSONParse } from '../../util/general';
import FilesystemStorage from 'redux-persist-filesystem-storage';

jest.mock('@metamask/utils', () => ({
  hasProperty: jest.fn(),
  isObject: jest.fn(),
}));

jest.mock('@sentry/react-native', () => ({
  captureException: jest.fn(),
}));

jest.mock('../../util/general', () => ({
  deepJSONParse: jest.fn(),
}));

jest.mock('redux-persist-filesystem-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  getAllKeys: jest.fn(),
  clear: jest.fn(),
}));

const mockHasProperty = jest.mocked(hasProperty);
const mockIsObject = jest.mocked(isObject);
const mockCaptureException = jest.mocked(captureException);
const mockDeepJSONParse = jest.mocked(deepJSONParse);
const mockFilesystemStorage = jest.mocked(FilesystemStorage);

describe('Migration #28', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return state unchanged if it is not an object', async () => {
    const state = 'invalid_state';
    const result = await migrate(state);

    expect(result).toEqual(state);
    expect(mockCaptureException).toHaveBeenCalledWith(expect.any(Error));
    expect(mockCaptureException).toHaveBeenCalledTimes(1);
    expect(mockIsObject).toHaveBeenCalledTimes(1);
  });

  it('should return state unchanged if engine already exists in state', async () => {
    const state = { engine: {} };
    const result = await migrate(state);

    expect(result).toEqual(state);
    expect(mockFilesystemStorage.getItem).not.toHaveBeenCalled();
    expect(mockIsObject).toHaveBeenCalledTimes(1);
  });

  it('should properly migrate state', async () => {
    const persistedData = { someData: 'example' };
    mockIsObject.mockReturnValue(true);
    mockHasProperty.mockReturnValue(false);
    mockDeepJSONParse.mockReturnValue(persistedData);
    mockFilesystemStorage.getItem.mockResolvedValue(
      JSON.stringify(persistedData),
    );
    mockFilesystemStorage.setItem.mockResolvedValue(undefined);
    mockFilesystemStorage.removeItem.mockResolvedValue(undefined);

    const state = {};
    const result = await migrate(state);
    // eslint-disable-next-line
    const mockValue = `{\"engine\":{\"backgroundState\":{\"AccountTrackerController\":{\"someData\":\"example\"},\"AddressBookController\":{\"someData\":\"example\"},\"AssetsContractController\":{\"someData\":\"example\"},\"NftController\":{\"someData\":\"example\"},\"TokensController\":{\"someData\":\"example\"},\"TokenDetectionController\":{\"someData\":\"example\"},\"NftDetectionController\":{\"someData\":\"example\"},\"KeyringController\":{\"someData\":\"example\"},\"NetworkController\":{\"someData\":\"example\"},\"PhishingController\":{\"someData\":\"example\"},\"PreferencesController\":{\"someData\":\"example\"},\"TokenBalancesController\":{\"someData\":\"example\"},\"TokenRatesController\":{\"someData\":\"example\"},\"TransactionController\":{\"someData\":\"example\"},\"SwapsController\":{\"someData\":\"example\"},\"TokenListController\":{\"someData\":\"example\"},\"CurrencyRateController\":{\"someData\":\"example\"},\"GasFeeController\":{\"someData\":\"example\"},\"ApprovalController\":{\"someData\":\"example\"},\"SnapController\":{\"someData\":\"example\"},\"subjectMetadataController\":{\"someData\":\"example\"},\"PermissionController\":{\"someData\":\"example\"},\"LoggingController\":{\"someData\":\"example\"},\"PPOMController\":{\"someData\":\"example\"}}}}`;

    const mockEngine = {
      AccountTrackerController: { someData: 'example' },
      AddressBookController: { someData: 'example' },
      AssetsContractController: { someData: 'example' },
      NftController: { someData: 'example' },
      TokensController: { someData: 'example' },
      TokenDetectionController: { someData: 'example' },
      NftDetectionController: { someData: 'example' },
      KeyringController: { someData: 'example' },
      NetworkController: { someData: 'example' },
      PhishingController: { someData: 'example' },
      PreferencesController: { someData: 'example' },
      TokenBalancesController: { someData: 'example' },
      TokenRatesController: { someData: 'example' },
      TransactionController: { someData: 'example' },
      SwapsController: { someData: 'example' },
      TokenListController: { someData: 'example' },
      CurrencyRateController: { someData: 'example' },
      GasFeeController: { someData: 'example' },
      ApprovalController: { someData: 'example' },
      SnapController: { someData: 'example' },
      subjectMetadataController: { someData: 'example' },
      PermissionController: { someData: 'example' },
      LoggingController: { someData: 'example' },
      PPOMController: { someData: 'example' },
    };

    expect(mockDeepJSONParse).toHaveBeenCalledTimes(controllerList.length);
    expect(mockHasProperty).toHaveBeenCalledTimes(controllerList.length);
    expect(mockFilesystemStorage.getItem).toHaveBeenCalledTimes(
      controllerList.length,
    );
    expect(mockFilesystemStorage.setItem).toHaveBeenCalledWith(
      'persist:root',
      mockValue,
      true,
    );
    expect(mockFilesystemStorage.removeItem).toHaveBeenCalledTimes(
      controllerList.length,
    );
    expect(result).toEqual({ engine: { backgroundState: mockEngine } });
    expect(mockCaptureException).not.toHaveBeenCalled();
  });
});
