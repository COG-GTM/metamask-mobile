import { hasProperty, isObject } from '@metamask/utils';
import { captureException } from '@sentry/react-native';
import FilesystemStorage from 'redux-persist-filesystem-storage';
import { deepJSONParse } from '../../util/general';
import migrate, { controllerList } from './028';

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
    expect(captureException).toHaveBeenCalledWith(expect.any(Error));
    expect(captureException).toHaveBeenCalledTimes(1);
    expect(isObject).toHaveBeenCalledTimes(1);
  });

  it('should return state unchanged if engine already exists in state', async () => {
    const state = { engine: {} };
    const result = await migrate(state);

    expect(result).toEqual(state);
    expect(FilesystemStorage.getItem).not.toHaveBeenCalled();
    expect(isObject).toHaveBeenCalledTimes(1);
  });

  it('should properly migrate state', async () => {
    const persistedData = { someData: 'example' };
    const getItemMock = jest
      .fn()
      .mockResolvedValue(JSON.stringify(persistedData));
    const setItemMock = jest.fn().mockResolvedValue(undefined);
    const removeItemMock = jest.fn().mockResolvedValue(undefined);
    const deepJSONParseMock = jest.mocked(deepJSONParse);
    deepJSONParseMock.mockReturnValue(persistedData);
    const hasPropertyMock = jest.mocked(hasProperty);
    hasPropertyMock.mockReturnValue(false);

    jest.mocked(isObject).mockReturnValue(true);
    FilesystemStorage.getItem = getItemMock;
    FilesystemStorage.setItem = setItemMock;
    FilesystemStorage.removeItem = removeItemMock;

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

    expect(deepJSONParseMock).toHaveBeenCalledTimes(controllerList.length);
    expect(hasPropertyMock).toHaveBeenCalledTimes(controllerList.length);
    expect(getItemMock).toHaveBeenCalledTimes(controllerList.length);
    expect(setItemMock).toHaveBeenCalledWith('persist:root', mockValue, true);
    expect(removeItemMock).toHaveBeenCalledTimes(controllerList.length);
    expect(result).toEqual({ engine: { backgroundState: mockEngine } });
    expect(captureException).not.toHaveBeenCalled();
  });
});
