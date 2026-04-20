const mockGetBuffer = jest.fn();
const mockSet = jest.fn();
const mockDelete = jest.fn();
const mockGetAllKeys = jest.fn();

jest.mock('react-native-mmkv', () => ({
  MMKV: jest.fn().mockImplementation(() => ({
    getBuffer: mockGetBuffer,
    set: mockSet,
    delete: mockDelete,
    getAllKeys: mockGetAllKeys,
  })),
}));

jest.mock('react-native-blob-jsi-helper', () => ({
  getArrayBufferForBlob: jest.fn(),
}));

// The source file's `window.FileReader?.prototype.readAsArrayBuffer` guard
// evaluates at module load; make sure `window` exists in the Node test env.
if (typeof global.window === 'undefined') {
  global.window = {};
}

// eslint-disable-next-line @typescript-eslint/no-require-imports, import/no-commonjs
const RNFSStorageBackend = require('./ppom-storage-backend').default;

describe('RNFSStorageBackend', () => {
  beforeEach(() => {
    mockGetBuffer.mockReset();
    mockSet.mockReset();
    mockDelete.mockReset();
    mockGetAllKeys.mockReset();
  });

  it('read returns the stored buffer for a key', async () => {
    const buf = new Uint8Array([1, 2, 3]);
    mockGetBuffer.mockReturnValue(buf);
    const backend = new RNFSStorageBackend('/base');

    const result = await backend.read({ name: 'data', chainId: '0x1' }, '');

    expect(mockGetBuffer).toHaveBeenCalledWith('data-0x1');
    expect(result).toBe(buf);
  });

  it('read throws a descriptive error when storage throws', async () => {
    mockGetBuffer.mockImplementation(() => {
      throw new Error('disk failure');
    });
    const backend = new RNFSStorageBackend('/base');

    await expect(
      backend.read({ name: 'data', chainId: '0x1' }, ''),
    ).rejects.toThrow('Error reading data');
  });

  it('read throws when no data is found', async () => {
    mockGetBuffer.mockReturnValue(undefined);
    const backend = new RNFSStorageBackend('/base');
    await expect(
      backend.read({ name: 'data', chainId: '0x1' }, ''),
    ).rejects.toThrow('No data found');
  });

  it('write stores the data as a Uint8Array', async () => {
    const backend = new RNFSStorageBackend('/base');
    const data = new ArrayBuffer(4);

    await backend.write({ name: 'd', chainId: '0x89' }, data, '');

    expect(mockSet).toHaveBeenCalledWith('d-0x89', expect.any(Uint8Array));
  });

  it('delete removes the data for a key', async () => {
    const backend = new RNFSStorageBackend('/base');
    await backend.delete({ name: 'd', chainId: '0x1' });
    expect(mockDelete).toHaveBeenCalledWith('d-0x1');
  });

  it('delete throws a descriptive error when storage throws', async () => {
    mockDelete.mockImplementation(() => {
      throw new Error('nope');
    });
    const backend = new RNFSStorageBackend('/base');
    await expect(
      backend.delete({ name: 'd', chainId: '0x1' }),
    ).rejects.toThrow('Error deleting data');
  });

  it('dir returns all storage keys parsed into {name, chainId}', async () => {
    mockGetAllKeys.mockReturnValue(['a-0x1', 'b-0x89']);
    const backend = new RNFSStorageBackend('/base');

    const keys = await backend.dir();

    expect(keys).toEqual([
      { name: 'a', chainId: '0x1' },
      { name: 'b', chainId: '0x89' },
    ]);
  });
});
