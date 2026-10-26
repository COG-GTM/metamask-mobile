import { Linking, Platform } from 'react-native';
import InAppReview from 'react-native-in-app-review';
import StorageWrapper from '../store/storage-wrapper';
import ReviewManager from './ReviewManager';
import { REVIEW_EVENT_COUNT, REVIEW_SHOWN_TIME } from '../constants/storage';
import { MM_APP_STORE_LINK, MM_PLAY_STORE_LINK } from '../constants/urls';

jest.mock('react-native-in-app-review', () => ({
  isAvailable: jest.fn(),
  RequestInAppReview: jest.fn(),
}));

const mockGetItem = StorageWrapper.getItem as jest.Mock;
const mockSetItem = StorageWrapper.setItem as jest.Mock;
const mockIsAvailable = InAppReview.isAvailable as jest.Mock;
const mockRequestReview = InAppReview.RequestInAppReview as jest.Mock;

const NOW = 20_000_000_000;
const flushPromises = () => new Promise((resolve) => setImmediate(resolve));

describe('ReviewManager', () => {
  let storage: Record<string, string | undefined>;

  beforeEach(() => {
    jest.clearAllMocks();
    storage = {};
    mockGetItem.mockImplementation(async (key: string) => storage[key]);
    mockSetItem.mockImplementation(async (key: string, value: string) => {
      storage[key] = value;
    });
    mockIsAvailable.mockReturnValue(true);
    mockRequestReview.mockResolvedValue(true);
    jest.spyOn(Date, 'now').mockReturnValue(NOW);
  });

  afterEach(() => {
    jest.spyOn(Date, 'now').mockRestore();
  });

  it('increments the event count without prompting below the threshold', async () => {
    await ReviewManager.promptReview();
    expect(storage[REVIEW_EVENT_COUNT]).toBe('1');
    expect(mockRequestReview).not.toHaveBeenCalled();
  });

  it('does not prompt when in-app review is unavailable', async () => {
    storage[REVIEW_EVENT_COUNT] = '10';
    mockIsAvailable.mockReturnValue(false);
    await ReviewManager.promptReview();
    expect(mockRequestReview).not.toHaveBeenCalled();
  });

  it('does not prompt when the review was shown recently', async () => {
    storage[REVIEW_EVENT_COUNT] = '10';
    storage[REVIEW_SHOWN_TIME] = `${Date.now()}`;
    await ReviewManager.promptReview();
    expect(mockRequestReview).not.toHaveBeenCalled();
  });

  it('prompts and resets the criteria when thresholds are met', async () => {
    storage[REVIEW_EVENT_COUNT] = '5';
    await ReviewManager.promptReview();
    await flushPromises();
    expect(mockRequestReview).toHaveBeenCalled();
    expect(storage[REVIEW_EVENT_COUNT]).toBe('0');
    expect(storage[REVIEW_SHOWN_TIME]).toBe(`${NOW}`);
  });

  it('falls back to the MetaMask review modal when the prompt fails', async () => {
    const navigate = jest.fn();
    ReviewManager.navigationRef = {
      current: { navigate },
    } as unknown as typeof ReviewManager.navigationRef;
    storage[REVIEW_EVENT_COUNT] = '6';
    mockRequestReview.mockRejectedValue(new Error('failed'));

    await ReviewManager.promptReview();
    await flushPromises();

    expect(navigate).toHaveBeenCalledWith('ReviewModal');
    ReviewManager.navigationRef = undefined;
  });

  it('swallows storage errors', async () => {
    mockGetItem.mockRejectedValue(new Error('storage'));
    await expect(ReviewManager.promptReview()).resolves.toBeUndefined();
    expect(mockRequestReview).not.toHaveBeenCalled();
  });

  it('opens the platform store review link', async () => {
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    const select = jest
      .spyOn(Platform, 'select')
      .mockImplementation((specifics) => (specifics as { ios: string }).ios);
    await ReviewManager.openFallbackStoreReview();
    expect(openURL).toHaveBeenCalledWith(
      `${MM_APP_STORE_LINK}?action=write-review`,
    );

    select.mockImplementation(
      (specifics) => (specifics as { android: string }).android,
    );
    openURL.mockRejectedValueOnce(new Error('failed'));
    await expect(ReviewManager.openFallbackStoreReview()).resolves.toBe(
      undefined,
    );
    expect(openURL).toHaveBeenLastCalledWith(MM_PLAY_STORE_LINK);

    select.mockReturnValue(undefined);
    await ReviewManager.openFallbackStoreReview();
    expect(openURL).toHaveBeenLastCalledWith('');

    openURL.mockRestore();
    select.mockRestore();
  });
});
