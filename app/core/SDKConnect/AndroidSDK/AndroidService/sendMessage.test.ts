/* eslint-disable @typescript-eslint/no-explicit-any */
import Logger from '../../../../util/Logger';
import { createMockInternalAccount } from '../../../../util/test/accountsControllerTestUtils';
import Engine from '../../../Engine';
import { Minimizer } from '../../../NativeModules';
import { RPC_METHODS } from '../../SDKConnectConstants';
import handleBatchRpcResponse from '../../handlers/handleBatchRpcResponse';
import { wait } from '../../utils/wait.util';
import AndroidService from '../AndroidService';
import sendMessage from './sendMessage';

jest.mock('../../../Engine');
jest.mock('../../../NativeModules', () => ({
  Minimizer: {
    goBack: jest.fn(),
  },
}));
jest.mock('../../../../util/Logger');
jest.mock('../../utils/wait.util', () => ({
  wait: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../AndroidService');
jest.mock('../../handlers/handleBatchRpcResponse', () => jest.fn());
jest.mock('../../utils/DevLogger');

const MOCK_ADDRESS = '0x1';
const mockInternalAccount = createMockInternalAccount(
  MOCK_ADDRESS,
  'Account 1',
);

describe('sendMessage', () => {
  let instance: jest.Mocked<AndroidService>;
  let message: any;

  const mockGetId = jest.fn();
  const mockRemove = jest.fn();
  const mockIsEmpty = jest.fn().mockReturnValue(true);
  const mockGet = jest.fn();
  const mockSendMessage = jest.fn();
  const mockGetById = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    instance = {
      rpcQueueManager: {
        getId: mockGetId,
        remove: mockRemove,
        isEmpty: mockIsEmpty,
        get: mockGet,
      },
      communicationClient: {
        sendMessage: mockSendMessage,
      },
      batchRPCManager: {
        getById: mockGetById,
      },
      bridgeByClientId: {},
      currentClientId: 'test-client-id',
    } as unknown as jest.Mocked<AndroidService>;

    message = {
      data: {
        id: 'test-id',
        result: ['0x1', '0x2'],
      },
    };

    (Engine.context as any) = {
      AccountsController: {
        getSelectedAccount: jest.fn().mockReturnValue(mockInternalAccount),
      },
    };
  });

  it('should send message with reordered accounts if selectedAddress is in result', async () => {
    mockGetId.mockReturnValue(RPC_METHODS.ETH_REQUESTACCOUNTS);

    await sendMessage(instance, message);

    expect(mockSendMessage).toHaveBeenCalledWith(
      JSON.stringify({
        ...message,
        data: {
          ...message.data,
          result: ['0x1', '0x2'],
        },
      }),
    );
  });

  it('should send message without reordering if selectedAddress is not in result', async () => {
    const MOCK_ADDRESS_2 = '0x3';
    const mockInternalAccount2 = createMockInternalAccount(
      MOCK_ADDRESS_2.toLowerCase(),
      'Account 2',
    );

    (Engine.context as any).AccountsController.getSelectedAccount = jest
      .fn()
      .mockReturnValue(mockInternalAccount2);

    mockGetId.mockReturnValue(RPC_METHODS.ETH_REQUESTACCOUNTS);

    await sendMessage(instance, message);

    expect(mockSendMessage).toHaveBeenCalledWith(JSON.stringify(message));
  });

  it('should handle multichain rpc call responses separately', async () => {
    mockGetId.mockReturnValue('someMethod');
    mockGetById.mockReturnValue(['rpc1', 'rpc2']);
    (handleBatchRpcResponse as jest.Mock).mockResolvedValue(true);

    await sendMessage(instance, message);

    expect(handleBatchRpcResponse).toHaveBeenCalled();
    expect(mockRemove).toHaveBeenCalledWith('test-id');
    expect(mockSendMessage).toHaveBeenCalledWith(JSON.stringify(message));
  });

  it('should not call goBack if rpcQueueManager is not empty', async () => {
    mockGetId.mockReturnValue('someMethod');
    mockIsEmpty.mockReturnValue(false);

    await sendMessage(instance, message);

    expect(Minimizer.goBack).not.toHaveBeenCalled();
  });

  it('should handle error when waiting for empty rpc queue', async () => {
    mockGetId.mockReturnValue('someMethod');
    (wait as jest.Mock).mockRejectedValue(new Error('test error'));

    await sendMessage(instance, message);

    expect(Logger.log).toHaveBeenCalledWith(
      expect.any(Error),
      `AndroidService:: error waiting for empty rpc queue`,
    );
  });

  describe('Serialization Edge Cases', () => {
    it('should handle message with null data field', async () => {
      const nullDataMessage = { data: null };
      mockGetId.mockReturnValue('someMethod');

      await sendMessage(instance, nullDataMessage);

      expect(mockSendMessage).toHaveBeenCalledWith(
        JSON.stringify(nullDataMessage),
      );
    });

    it('should handle message with undefined id field', async () => {
      const undefinedIdMessage = { data: { result: ['0x1'] } };
      mockGetId.mockReturnValue('someMethod');

      await sendMessage(instance, undefinedIdMessage);

      expect(mockSendMessage).toHaveBeenCalledWith(
        JSON.stringify(undefinedIdMessage),
      );
      expect(mockRemove).toHaveBeenCalledWith(undefined);
    });

    it('should handle message with empty data object', async () => {
      const emptyDataMessage = { data: {} };
      mockGetId.mockReturnValue('someMethod');

      await sendMessage(instance, emptyDataMessage);

      expect(mockSendMessage).toHaveBeenCalledWith(
        JSON.stringify(emptyDataMessage),
      );
    });

    it('should handle message with nested stringified JSON in result', async () => {
      const nestedJsonMessage = {
        data: {
          id: 'nested-test',
          result: JSON.stringify({ nested: 'value', array: [1, 2, 3] }),
        },
      };
      mockGetId.mockReturnValue('someMethod');

      await sendMessage(instance, nestedJsonMessage);

      expect(mockSendMessage).toHaveBeenCalledWith(
        JSON.stringify(nestedJsonMessage),
      );
    });

    it('should handle large message payloads', async () => {
      const largeArray = Array(10000)
        .fill(null)
        .map((_, i) => `0x${i.toString(16)}`);
      const largeMessage = {
        data: {
          id: 'large-payload-test',
          result: largeArray,
        },
      };
      mockGetId.mockReturnValue('someMethod');

      await sendMessage(instance, largeMessage);

      expect(mockSendMessage).toHaveBeenCalledWith(
        JSON.stringify(largeMessage),
      );
    });

    it('should handle message with Unicode characters', async () => {
      const unicodeMessage = {
        data: {
          id: 'unicode-test',
          result: ['Hello 世界', '🚀 Rocket', 'Ñoño', '日本語テスト'],
        },
      };
      mockGetId.mockReturnValue('someMethod');

      await sendMessage(instance, unicodeMessage);

      expect(mockSendMessage).toHaveBeenCalledWith(
        JSON.stringify(unicodeMessage),
      );
    });

    it('should handle message with special escape sequences', async () => {
      const escapeMessage = {
        data: {
          id: 'escape-test',
          result: [
            'line1\nline2',
            'tab\there',
            'quote"inside',
            'backslash\\path',
          ],
        },
      };
      mockGetId.mockReturnValue('someMethod');

      await sendMessage(instance, escapeMessage);

      expect(mockSendMessage).toHaveBeenCalledWith(
        JSON.stringify(escapeMessage),
      );
    });

    it('should handle message with deeply nested objects', async () => {
      const deeplyNestedMessage = {
        data: {
          id: 'deep-nested-test',
          result: {
            level1: {
              level2: {
                level3: {
                  level4: {
                    value: 'deep',
                  },
                },
              },
            },
          },
        },
      };
      mockGetId.mockReturnValue('someMethod');

      await sendMessage(instance, deeplyNestedMessage);

      expect(mockSendMessage).toHaveBeenCalledWith(
        JSON.stringify(deeplyNestedMessage),
      );
    });

    it('should handle message with mixed data types in result', async () => {
      const mixedTypesMessage = {
        data: {
          id: 'mixed-types-test',
          result: [
            'string',
            123,
            true,
            null,
            { obj: 'value' },
            ['nested', 'array'],
          ],
        },
      };
      mockGetId.mockReturnValue('someMethod');

      await sendMessage(instance, mixedTypesMessage);

      expect(mockSendMessage).toHaveBeenCalledWith(
        JSON.stringify(mixedTypesMessage),
      );
    });

    it('should handle message with empty result array for ETH_REQUESTACCOUNTS', async () => {
      const emptyResultMessage = {
        data: {
          id: 'empty-result-test',
          result: [],
        },
      };
      mockGetId.mockReturnValue(RPC_METHODS.ETH_REQUESTACCOUNTS);

      await sendMessage(instance, emptyResultMessage);

      expect(mockSendMessage).toHaveBeenCalledWith(
        JSON.stringify(emptyResultMessage),
      );
    });

    it('should handle message with non-array result for ETH_REQUESTACCOUNTS', async () => {
      const nonArrayResultMessage = {
        data: {
          id: 'non-array-result-test',
          result: 'not-an-array',
        },
      };
      mockGetId.mockReturnValue(RPC_METHODS.ETH_REQUESTACCOUNTS);

      await expect(sendMessage(instance, nonArrayResultMessage)).rejects.toThrow();
    });
  });

  describe('Error Scenarios', () => {
    it('should handle communicationClient.sendMessage throwing an error', async () => {
      mockGetId.mockReturnValue('someMethod');
      mockSendMessage.mockImplementation(() => {
        throw new Error('Send message failed');
      });

      await expect(sendMessage(instance, message)).rejects.toThrow(
        'Send message failed',
      );
    });

    it('should handle batch RPC response returning false (not last RPC)', async () => {
      mockGetId.mockReturnValue('someMethod');
      mockGetById.mockReturnValue(['rpc1', 'rpc2']);
      (handleBatchRpcResponse as jest.Mock).mockResolvedValue(false);

      await sendMessage(instance, message);

      expect(handleBatchRpcResponse).toHaveBeenCalled();
      expect(mockRemove).toHaveBeenCalledWith('test-id');
      expect(Minimizer.goBack).not.toHaveBeenCalled();
    });

    it('should handle batch RPC response throwing an error', async () => {
      mockGetId.mockReturnValue('someMethod');
      mockGetById.mockReturnValue(['rpc1', 'rpc2']);
      (handleBatchRpcResponse as jest.Mock).mockRejectedValue(
        new Error('Batch RPC error'),
      );

      await expect(sendMessage(instance, message)).rejects.toThrow(
        'Batch RPC error',
      );
    });

    it('should handle multiple consecutive timeout errors', async () => {
      mockGetId.mockReturnValue('someMethod');
      const timeoutError = new Error('Timeout waiting for queue');
      (wait as jest.Mock).mockRejectedValue(timeoutError);

      await sendMessage(instance, message);
      await sendMessage(instance, message);

      expect(Logger.log).toHaveBeenCalledTimes(2);
      expect(Logger.log).toHaveBeenCalledWith(
        timeoutError,
        `AndroidService:: error waiting for empty rpc queue`,
      );
    });

    it('should handle error when AccountsController.getSelectedAccount throws', async () => {
      mockGetId.mockReturnValue(RPC_METHODS.ETH_REQUESTACCOUNTS);
      (Engine.context as any).AccountsController.getSelectedAccount = jest
        .fn()
        .mockImplementation(() => {
          throw new Error('Account not found');
        });

      await expect(sendMessage(instance, message)).rejects.toThrow(
        'Account not found',
      );
    });

    it('should handle null currentClientId when processing batch RPC', async () => {
      instance.currentClientId = undefined;
      mockGetId.mockReturnValue('someMethod');
      mockGetById.mockReturnValue(['rpc1', 'rpc2']);
      (handleBatchRpcResponse as jest.Mock).mockResolvedValue(true);

      await sendMessage(instance, message);

      expect(handleBatchRpcResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          backgroundBridge: undefined,
        }),
      );
    });

    it('should skip goBack when rpcMethod is undefined and forceRedirect is false', async () => {
      mockGetId.mockReturnValue(undefined);

      await sendMessage(instance, message, false);

      expect(mockSendMessage).toHaveBeenCalled();
      expect(Minimizer.goBack).not.toHaveBeenCalled();
    });

    it('should proceed with goBack when rpcMethod is undefined but forceRedirect is true', async () => {
      mockGetId.mockReturnValue(undefined);
      mockIsEmpty.mockReturnValue(true);

      await sendMessage(instance, message, true);

      expect(mockSendMessage).toHaveBeenCalled();
    });
  });

  describe('Batch RPC Edge Cases', () => {
    it('should handle empty chainRPCs array', async () => {
      mockGetId.mockReturnValue('someMethod');
      mockGetById.mockReturnValue([]);
      (handleBatchRpcResponse as jest.Mock).mockResolvedValue(true);

      await sendMessage(instance, message);

      expect(handleBatchRpcResponse).toHaveBeenCalled();
    });

    it('should use correct bridge from bridgeByClientId for batch RPC', async () => {
      const mockBridge = { onMessage: jest.fn() };
      instance.bridgeByClientId = { 'test-client-id': mockBridge as any };
      instance.currentClientId = 'test-client-id';
      mockGetId.mockReturnValue('someMethod');
      mockGetById.mockReturnValue(['rpc1']);
      (handleBatchRpcResponse as jest.Mock).mockResolvedValue(true);

      await sendMessage(instance, message);

      expect(handleBatchRpcResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          backgroundBridge: mockBridge,
        }),
      );
    });

    it('should handle batch RPC with error in message data', async () => {
      const errorMessage = {
        data: {
          id: 'error-test',
          error: { code: -32000, message: 'User rejected' },
        },
      };
      mockGetId.mockReturnValue('someMethod');
      mockGetById.mockReturnValue(['rpc1', 'rpc2']);
      (handleBatchRpcResponse as jest.Mock).mockResolvedValue(true);

      await sendMessage(instance, errorMessage);

      expect(handleBatchRpcResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          msg: errorMessage,
        }),
      );
    });
  });
});
