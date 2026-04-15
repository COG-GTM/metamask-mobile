
import { PROTOCOLS } from '../../../constants/deeplinks';
import BackgroundBridge from '../../BackgroundBridge/BackgroundBridge';

import DevLogger from '../utils/DevLogger';
import setupBridge from './setupBridge';

jest.mock('../../BackgroundBridge/BackgroundBridge');
jest.mock('../Connection');
jest.mock('../utils/DevLogger');
jest.mock('./handleSendMessage');
jest.mock('../../../util/Logger');
jest.mock('../../AppConstants');
jest.mock('../../../constants/deeplinks');

describe('setupBridge', () => {
  let originatorInfo = {};
  let connection = {};

  beforeEach(() => {
    jest.clearAllMocks();
    originatorInfo = {
      url: 'https://example.com',
      dappId: 'https://example.com',
      title: 'Test Title',
      platform: 'testPlatform'
    };
    connection = {
      origin: 'testOrigin',
      trigger: 'testTrigger'
    };
  });

  it('should returns existing backgroundBridge if it already exists', () => {
    const existingBridge = new BackgroundBridge();
    connection.backgroundBridge = existingBridge;

    const result = setupBridge({ originatorInfo, connection });

    expect(result).toBe(existingBridge);
    expect(DevLogger.log).toHaveBeenCalledWith(
      `setupBridge:: backgroundBridge already exists`
    );
  });

  it('should creates a new backgroundBridge if it does not exist', () => {
    connection.backgroundBridge = undefined;

    const result = setupBridge({ originatorInfo, connection });

    expect(result).toBeInstanceOf(BackgroundBridge);
    expect(BackgroundBridge).toHaveBeenCalledWith(expect.any(Object));
  });

  it('should setup backgroundBridge with correct url and isRemoteConn', () => {
    connection.backgroundBridge = undefined;
    const expectedUrl =
    PROTOCOLS.METAMASK + '://' + originatorInfo.url ?? originatorInfo.title;

    setupBridge({ originatorInfo, connection });

    expect(BackgroundBridge).toHaveBeenCalledWith(
      expect.objectContaining({
        url: expectedUrl,
        isRemoteConn: true
      })
    );
  });

  it('should setup backgroundBridge with correct sendMessage', () => {
    connection.backgroundBridge = undefined;

    setupBridge({ originatorInfo, connection });

    expect(BackgroundBridge).toHaveBeenCalledWith(
      expect.objectContaining({
        sendMessage: expect.any(Function)
      })
    );
  });

  it('should setup backgroundBridge with correct getApprovedHosts', () => {
    connection.backgroundBridge = undefined;

    setupBridge({ originatorInfo, connection });

    expect(BackgroundBridge).toHaveBeenCalledWith(
      expect.objectContaining({
        getApprovedHosts: expect.any(Function)
      })
    );
  });

  it('should setup backgroundBridge with correct remoteConnHost', () => {
    connection.backgroundBridge = undefined;

    setupBridge({ originatorInfo, connection });

    expect(BackgroundBridge).toHaveBeenCalledWith(
      expect.objectContaining({
        remoteConnHost: connection.host
      })
    );
  });

  it('should setup backgroundBridge with correct getRpcMethodMiddleware', () => {
    connection.backgroundBridge = undefined;

    setupBridge({ originatorInfo, connection });

    expect(BackgroundBridge).toHaveBeenCalledWith(
      expect.objectContaining({
        getRpcMethodMiddleware: expect.any(Function)
      })
    );
  });

  it('should setup backgroundBridge with correct params', () => {
    connection.backgroundBridge = undefined;

    setupBridge({ originatorInfo, connection });

    expect(BackgroundBridge).toHaveBeenCalledWith(
      expect.objectContaining({
        webview: null,
        isMMSDK: true
      })
    );
  });
});