import { ActionType } from '../../../actions/sdk';
import { store } from '../../../store';
import { ConnectionProps } from '../Connection';
import SDKConnect from '../SDKConnect';
import removeDappConnection from './removeDappConnection';

jest.mock('../SDKConnect');
jest.mock('../utils/DevLogger');
jest.mock('../../../store', () => ({
  store: { dispatch: jest.fn() },
}));

describe('removeDappConnection', () => {
  let mockInstance = {} as unknown as SDKConnect;

  beforeEach(() => {
    jest.clearAllMocks();

    mockInstance = {
      state: {
        connections: {},
        dappConnections: {
          'test-id': { id: 'test-id' } as unknown as ConnectionProps,
          'other-id': { id: 'other-id' } as unknown as ConnectionProps,
        },
      },
    } as unknown as SDKConnect;
  });

  it('removes the connection from the instance state and the redux store', async () => {
    await removeDappConnection('test-id', mockInstance);

    expect(mockInstance.state.dappConnections['test-id']).toBeUndefined();
    expect(mockInstance.state.dappConnections['other-id']).toBeDefined();
    expect(store.dispatch).toHaveBeenCalledWith({
      type: ActionType.REMOVE_DAPP_CONNECTION,
      channelId: 'test-id',
    });
  });
});
