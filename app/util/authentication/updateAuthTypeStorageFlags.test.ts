import { updateAuthTypeStorageFlags } from './updateAuthTypeStorageFlags';
import StorageWrapper from '../../store/storage-wrapper';

jest.mock('../../store/storage-wrapper', () => ({
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe('updateAuthTypeStorageFlags', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should set disabled flags when biometry choice is false', async () => {
    await updateAuthTypeStorageFlags(false);
    expect(StorageWrapper.setItem).toHaveBeenCalledTimes(2);
  });

  it('should remove disabled flags when biometry choice is true', async () => {
    await updateAuthTypeStorageFlags(true);
    expect(StorageWrapper.removeItem).toHaveBeenCalledTimes(2);
  });
});
