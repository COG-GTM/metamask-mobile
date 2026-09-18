import { shouldShowWhatsNewModal } from '.';
import StorageWrapper from '../../store/storage-wrapper';
import { whatsNewList } from '../../components/UI/WhatsNewModal';
import {
  WHATS_NEW_APP_VERSION_SEEN,
  CURRENT_APP_VERSION,
  LAST_APP_VERSION,
} from '../../constants/storage';

jest.mock('../../store/storage-wrapper', () => ({
  getItem: jest.fn(),
}));

jest.mock('../../components/UI/WhatsNewModal', () => ({
  whatsNewList: {
    onlyUpdates: false,
    maxLastAppVersion: '7.20',
    minAppVersion: '7.16.0',
    slides: [[{ type: 'title', title: 'hello' }]],
  },
}));

const mockGetItem = StorageWrapper.getItem as jest.Mock;

const setStorage = (values: {
  seen?: string | null;
  current?: string | null;
  last?: string | null;
}) => {
  mockGetItem.mockImplementation(async (key: string) => {
    switch (key) {
      case WHATS_NEW_APP_VERSION_SEEN:
        return values.seen ?? null;
      case CURRENT_APP_VERSION:
        return values.current ?? null;
      case LAST_APP_VERSION:
        return values.last ?? null;
      default:
        return null;
    }
  });
};

describe('shouldShowWhatsNewModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    whatsNewList.onlyUpdates = false;
    whatsNewList.slides = [[{ type: 'title', title: 'hello' }]];
  });

  it('returns false when the modal was already seen for a recent enough version', async () => {
    setStorage({ seen: '7.16.0', current: '7.17.0', last: '7.15.0' });
    expect(await shouldShowWhatsNewModal()).toBe(false);
  });

  it('returns true when never seen and the current version is new enough', async () => {
    setStorage({ seen: null, current: '7.17.0', last: '7.15.0' });
    expect(await shouldShowWhatsNewModal()).toBe(true);
  });

  it('returns true when seen for an older version than minAppVersion', async () => {
    setStorage({ seen: '7.10.0', current: '7.17.0', last: '7.15.0' });
    expect(await shouldShowWhatsNewModal()).toBe(true);
  });

  it('returns false when the current version is below minAppVersion', async () => {
    setStorage({ seen: null, current: '7.15.0', last: '7.14.0' });
    expect(await shouldShowWhatsNewModal()).toBe(false);
  });

  it('returns false when there are no slides', async () => {
    whatsNewList.slides = [];
    setStorage({ seen: null, current: '7.17.0', last: '7.15.0' });
    expect(await shouldShowWhatsNewModal()).toBe(false);
  });

  describe('when onlyUpdates is enabled', () => {
    beforeEach(() => {
      whatsNewList.onlyUpdates = true;
    });

    it('returns false for fresh installs (no last version)', async () => {
      setStorage({ seen: null, current: '7.17.0', last: null });
      expect(await shouldShowWhatsNewModal()).toBe(false);
    });

    it('returns false when the app was not updated', async () => {
      setStorage({ seen: null, current: '7.17.0', last: '7.17.0' });
      expect(await shouldShowWhatsNewModal()).toBe(false);
    });

    it('returns false when the previous version is not below maxLastAppVersion', async () => {
      setStorage({ seen: null, current: '7.21.0', last: '7.20.0' });
      expect(await shouldShowWhatsNewModal()).toBe(false);
    });

    it('returns true when updating from an old enough version', async () => {
      setStorage({ seen: null, current: '7.17.0', last: '7.15.0' });
      expect(await shouldShowWhatsNewModal()).toBe(true);
    });
  });
});
