import {
  BIOMETRY_CHOICE_DISABLED,
  PASSCODE_DISABLED,
  TRUE,
} from '../../constants/storage';
import StorageWrapper from '../../store/storage-wrapper';
import { updateAuthTypeStorageFlags } from './updateAuthTypeStorageFlags';

jest.mock('../../store/storage-wrapper', () => ({
  __esModule: true,
  default: {
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

const mockedSetItem = StorageWrapper.setItem as jest.Mock;
const mockedRemoveItem = StorageWrapper.removeItem as jest.Mock;

describe('updateAuthTypeStorageFlags', () => {
  beforeEach(() => {
    mockedSetItem.mockReset();
    mockedRemoveItem.mockReset();
  });

  it('disables biometry and passcode flags when newBiometryChoice is false', async () => {
    await updateAuthTypeStorageFlags(false);
    expect(mockedSetItem).toHaveBeenCalledWith(BIOMETRY_CHOICE_DISABLED, TRUE);
    expect(mockedSetItem).toHaveBeenCalledWith(PASSCODE_DISABLED, TRUE);
    expect(mockedRemoveItem).not.toHaveBeenCalled();
  });

  it('removes both flags when newBiometryChoice is true', async () => {
    await updateAuthTypeStorageFlags(true);
    expect(mockedRemoveItem).toHaveBeenCalledWith(BIOMETRY_CHOICE_DISABLED);
    expect(mockedRemoveItem).toHaveBeenCalledWith(PASSCODE_DISABLED);
    expect(mockedSetItem).not.toHaveBeenCalled();
  });
});
