import StorageWrapper from '../../../store/storage-wrapper';
import loadDappConnections from './loadDappConnections';
import { store } from '../../../store';

jest.mock('../../../core/AppConstants');
jest.mock('../../../store/storage-wrapper', () => ({
  getItem: jest.fn().mockResolvedValue(''),
  setItem: jest.fn().mockResolvedValue(''),
}));
jest.mock('../utils/DevLogger');
jest.mock('../../../store', () => ({
  store: {
    getState: jest.fn(() => ({
      sdk: {
        connections: {},
        approvedHosts: {},
      },
    })),
  },
}));

describe('loadDappConnections', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return an empty object if no connections are found', async () => {
    const result = await loadDappConnections();

    expect(result).toStrictEqual({});
  });

  it('should parse the retrieved connections', async () => {
    const mockConnections = {};

    (StorageWrapper.getItem as jest.Mock).mockResolvedValueOnce(
      JSON.stringify(mockConnections),
    );

    const result = await loadDappConnections();

    expect(result).toStrictEqual(mockConnections);
  });

  it('drops sessions whose id is not a UUID', async () => {
    const validId = '5b3c1a2e-8f4d-4c6b-9a7e-1d2f3a4b5c6d';
    (store.getState as jest.Mock).mockReturnValueOnce({
      sdk: {
        dappConnections: {
          [validId]: { id: validId },
          'swap.example.org': { id: 'swap.example.org' },
        },
      },
    });

    const result = await loadDappConnections();

    expect(Object.keys(result)).toStrictEqual([validId]);
  });
});
