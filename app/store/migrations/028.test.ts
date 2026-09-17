import migrate, { controllerList } from './028';
import { captureException } from '@sentry/react-native';
import { hasProperty, isObject } from '@metamask/utils';
import FilesystemStorage from 'redux-persist-filesystem-storage';
import { deepJSONParse } from '../../util/general';

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

describe('Migration #28', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  jest.mock('@sentry/react-native', () => ({
    captureException: jest.fn(),
  }));

  it('should return state unchanged if it is not an object', async () => {
    const state = 'invalid_state';
    const result = await migrate(state);

    expect(result).toEqual(state);
    expect(jest.mocked(captureException)).toHaveBeenCalledWith(
      expect.any(Error),
    );
    expect(jest.mocked(captureException)).toHaveBeenCalledTimes(1);
    expect(jest.mocked(isObject)).toHaveBeenCalledTimes(1);
  });

  it('should return state unchanged if engine already exists in state', async () => {
    const state = { engine: {} };
    const result = await migrate(state);

    expect(result).toEqual(state);
    expect(jest.mocked(FilesystemStorage.getItem)).not.toHaveBeenCalled();
    expect(jest.mocked(isObject)).toHaveBeenCalledTimes(1);
  });

  it('should properly migrate state', async () => {
    const persistedData = { someData: 'example' };

    jest.mocked(isObject).mockReturnValue(true);
    jest.mocked(hasProperty).mockReturnValue(false);
    jest.mocked(deepJSONParse).mockReturnValue(persistedData);
    jest
      .mocked(FilesystemStorage.getItem)
      .mockResolvedValue(JSON.stringify(persistedData));
    jest.mocked(FilesystemStorage.setItem).mockResolvedValue(undefined);
    jest.mocked(FilesystemStorage.removeItem).mockResolvedValue(undefined);

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

    expect(jest.mocked(deepJSONParse)).toHaveBeenCalledTimes(
      controllerList.length,
    );
    expect(jest.mocked(hasProperty)).toHaveBeenCalledTimes(
      controllerList.length,
    );
    expect(jest.mocked(FilesystemStorage.getItem)).toHaveBeenCalledTimes(
      controllerList.length,
    );
    expect(jest.mocked(FilesystemStorage.setItem)).toHaveBeenCalledWith(
      'persist:root',
      mockValue,
      true,
    );
    expect(jest.mocked(FilesystemStorage.removeItem)).toHaveBeenCalledTimes(
      controllerList.length,
    );
    expect(result).toEqual({ engine: { backgroundState: mockEngine } });
    expect(jest.mocked(captureException)).not.toHaveBeenCalled();
  });
});
