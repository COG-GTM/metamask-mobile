import { removeDappConnection as removeDappConnectionAction } from '../../../actions/sdk';
import { store } from '../../../store';
import { ConnectionProps } from '../Connection';
import SDKConnect from '../SDKConnect';
import removeDappConnection from './removeDappConnection';

jest.mock('../Connection');
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
          other: { id: 'other' } as unknown as ConnectionProps,
        },
      },
    } as unknown as SDKConnect;
  });

  it('removes the connection from instance state and the persisted store', async () => {
    await removeDappConnection('test-id', mockInstance);

    expect(mockInstance.state.dappConnections['test-id']).toBeUndefined();
    expect(mockInstance.state.dappConnections.other).toBeDefined();
    expect(store.dispatch).toHaveBeenCalledWith(
      removeDappConnectionAction('test-id'),
    );
  });
});
