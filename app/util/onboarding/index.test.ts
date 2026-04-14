import { shouldShowWhatsNewModal } from './index';

jest.mock('../../store/storage-wrapper', () => ({
  getItem: jest.fn().mockResolvedValue(null),
}));

jest.mock('../../components/UI/WhatsNewModal', () => ({
  whatsNewList: {
    minAppVersion: '1.0.0',
    maxLastAppVersion: '2.0.0',
    onlyUpdates: false,
    slides: [],
  },
}));

jest.mock('compare-versions', () => ({
  __esModule: true,
  default: {
    compare: jest.fn().mockReturnValue(true),
  },
}));

describe('onboarding utils', () => {
  it('shouldShowWhatsNewModal should return false when no slides', async () => {
    const result = await shouldShowWhatsNewModal();
    expect(result).toBe(false);
  });
});
