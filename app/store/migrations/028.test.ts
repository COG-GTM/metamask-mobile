import migrate, { controllerList } from './028';
import { isObject, hasProperty } from '@metamask/utils';
import { captureException } from '@sentry/react-native';
import { deepJSONParse } from '../../util/general';
import RNFSStorage from 'redux-persist-filesystem-storage';

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

const mockedIsObject = jest.mocked(isObject);
const mockedHasProperty = jest.mocked(hasProperty);
const mockedCaptureException = jest.mocked(captureException);
const mockedDeepJSONParse = jest.mocked(deepJSONParse);
const mockedGetItem = jest.mocked(RNFSStorage.getItem);
const mockedSetItem = jest.mocked(RNFSStorage.setItem);
const mockedRemoveItem = jest.mocked(RNFSStorage.removeItem);

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
    expect(mockedCaptureException).toHaveBeenCalledWith(expect.any(Error));
    expect(mockedCaptureException).toHaveBeenCalledTimes(1);
    expect(mockedIsObject).toHaveBeenCalledTimes(1);
  });

  it('should return state unchanged if engine already exists in state', async () => {
    const state = { engine: {} };
    const result = await migrate(state);

    expect(result).toEqual(state);
    expect(mockedGetItem).not.toHaveBeenCalled();
    expect(mockedIsObject).toHaveBeenCalledTimes(1);
  });

  it('should properly migrate state', async () => {
    const persistedData = { someData: 'example' };
    mockedGetItem.mockResolvedValue(JSON.stringify(persistedData));
    mockedSetItem.mockResolvedValue(undefined);
    mockedRemoveItem.mockResolvedValue(undefined);
    mockedDeepJSONParse.mockReturnValue(persistedData);
    mockedHasProperty.mockReturnValue(false);
    mockedIsObject.mockReturnValue(true);

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

    expect(mockedDeepJSONParse).toHaveBeenCalledTimes(controllerList.length);
    expect(mockedHasProperty).toHaveBeenCalledTimes(controllerList.length);
    expect(mockedGetItem).toHaveBeenCalledTimes(controllerList.length);
    expect(mockedSetItem).toHaveBeenCalledWith('persist:root', mockValue, true);
    expect(mockedRemoveItem).toHaveBeenCalledTimes(controllerList.length);
    expect(result).toEqual({ engine: { backgroundState: mockEngine } });
    expect(mockedCaptureException).not.toHaveBeenCalled();
  });
});
