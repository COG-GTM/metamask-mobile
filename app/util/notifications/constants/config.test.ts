jest.mock('../../test/utils', () => ({
  __esModule: true,
  get isE2E() {
    return jest.requireMock('../../test/utils').__isE2E ?? false;
  },
  __isE2E: false,
}));

import {
  ModalFieldType,
  ModalFooterType,
  ModalHeaderType,
  isNotificationsFeatureEnabled,
} from './config';

const utilsMock = jest.requireMock('../../test/utils') as { __isE2E: boolean };

describe('notifications/constants/config', () => {
  const originalFlag = process.env.MM_NOTIFICATIONS_UI_ENABLED;

  beforeEach(() => {
    utilsMock.__isE2E = false;
  });

  afterEach(() => {
    if (originalFlag === undefined) {
      delete process.env.MM_NOTIFICATIONS_UI_ENABLED;
    } else {
      process.env.MM_NOTIFICATIONS_UI_ENABLED = originalFlag;
    }
    utilsMock.__isE2E = false;
  });

  it('exports ModalFieldType enum values', () => {
    expect(ModalFieldType.ASSET).toBe('ModalField-Asset');
    expect(ModalFieldType.ADDRESS).toBe('ModalField-Address');
    expect(ModalFieldType.NETWORK).toBe('ModalField-Network');
  });

  it('exports ModalFooterType enum values', () => {
    expect(ModalFooterType.BLOCK_EXPLORER).toBe('ModalFooter-BlockExplorer');
    expect(ModalFooterType.ANNOUNCEMENT_CTA).toBe(
      'ModalFooter-AnnouncementCta',
    );
  });

  it('exports ModalHeaderType enum values', () => {
    expect(ModalHeaderType.NFT_IMAGE).toBe('ModalHeader-NFTImage');
    expect(ModalHeaderType.ANNOUNCEMENT_IMAGE).toBe(
      'ModalHeader-AnnouncementImage',
    );
  });

  it('short-circuits to true in e2e mode, regardless of the build flag', () => {
    utilsMock.__isE2E = true;
    process.env.MM_NOTIFICATIONS_UI_ENABLED = 'false';
    expect(isNotificationsFeatureEnabled()).toBe(true);
  });

  it('returns false when the build flag is off and remote flag is unavailable', () => {
    process.env.MM_NOTIFICATIONS_UI_ENABLED = 'false';
    expect(isNotificationsFeatureEnabled()).toBe(false);
  });

  it('returns false when the remote flag is unavailable even if the build flag is true', () => {
    process.env.MM_NOTIFICATIONS_UI_ENABLED = 'true';
    expect(isNotificationsFeatureEnabled()).toBe(false);
  });
});
