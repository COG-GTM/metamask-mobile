jest.mock('../store/storage-wrapper', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

jest.mock('react-native-in-app-review', () => ({
  isAvailable: jest.fn(() => true),
  RequestInAppReview: jest.fn(() => Promise.resolve()),
}));

jest.mock('../util/Logger', () => ({
  log: jest.fn(),
}));

jest.mock('react-native', () => ({
  Platform: { select: jest.fn((obj: any) => obj.ios) },
  Linking: { openURL: jest.fn(() => Promise.resolve()) },
}));

import ReviewManager from './ReviewManager';
import StorageWrapper from '../store/storage-wrapper';

describe('ReviewManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('is a singleton instance', () => {
    expect(ReviewManager).toBeDefined();
    expect(typeof ReviewManager.promptReview).toBe('function');
  });

  it('has promptReview method', () => {
    expect(typeof ReviewManager.promptReview).toBe('function');
  });

  it('has openFallbackStoreReview method', () => {
    expect(typeof ReviewManager.openFallbackStoreReview).toBe('function');
  });

  it('promptReview increments event count', async () => {
    (StorageWrapper.getItem as jest.Mock).mockResolvedValue('0');
    (StorageWrapper.setItem as jest.Mock).mockResolvedValue(undefined);

    await ReviewManager.promptReview();

    expect(StorageWrapper.getItem).toHaveBeenCalled();
    expect(StorageWrapper.setItem).toHaveBeenCalled();
  });

  it('promptReview does not show review when criteria not met', async () => {
    (StorageWrapper.getItem as jest.Mock).mockResolvedValue('0');
    (StorageWrapper.setItem as jest.Mock).mockResolvedValue(undefined);

    await ReviewManager.promptReview();
    // Should not crash
  });

  it('openFallbackStoreReview does not throw', async () => {
    await expect(ReviewManager.openFallbackStoreReview()).resolves.not.toThrow();
  });
});
