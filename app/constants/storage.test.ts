import {
  EXISTING_USER,
  BIOMETRY_CHOICE,
  BIOMETRY_CHOICE_DISABLED,
  PASSCODE_CHOICE,
  PASSCODE_DISABLED,
  ONBOARDING_WIZARD,
  METRICS_OPT_IN,
  ANALYTICS_DATA_DELETION_TASK_ID,
  ANALYTICS_DATA_DELETION_DATE,
  METAMETRICS_DELETION_REGULATION_ID,
  ANALYTICS_DATA_RECORDED,
  METAMETRICS_ID,
  MIXPANEL_METAMETRICS_ID,
  WALLETCONNECT_SESSIONS,
  LAST_INCOMING_TX_BLOCK_INFO,
  PUSH_NOTIFICATIONS_PROMPT_COUNT,
  PUSH_NOTIFICATIONS_PROMPT_TIME,
  LANGUAGE,
  ENCRYPTION_LIB,
  SEED_PHRASE_HINTS,
  TRUE,
  AGREED,
  DENIED,
  EXPLORED,
  ORIGINAL,
  DEBUG,
  LAST_APP_VERSION,
  CURRENT_APP_VERSION,
  WHATS_NEW_APP_VERSION_SEEN,
  REVIEW_EVENT_COUNT,
  REVIEW_SHOWN_TIME,
  themeAppearanceLight,
  USE_TERMS,
  SOLANA_FEATURE_MODAL_SHOWN,
} from './storage';

describe('storage constants', () => {
  const prefix = '@MetaMask:';

  it('EXISTING_USER has correct prefix', () => {
    expect(EXISTING_USER).toBe(`${prefix}existingUser`);
  });

  it('BIOMETRY_CHOICE has correct prefix', () => {
    expect(BIOMETRY_CHOICE).toBe(`${prefix}biometryChoice`);
  });

  it('BIOMETRY_CHOICE_DISABLED has correct prefix', () => {
    expect(BIOMETRY_CHOICE_DISABLED).toBe(`${prefix}biometryChoiceDisabled`);
  });

  it('PASSCODE_CHOICE has correct prefix', () => {
    expect(PASSCODE_CHOICE).toBe(`${prefix}passcodeChoice`);
  });

  it('PASSCODE_DISABLED has correct prefix', () => {
    expect(PASSCODE_DISABLED).toBe(`${prefix}passcodeDisabled`);
  });

  it('ONBOARDING_WIZARD has correct prefix', () => {
    expect(ONBOARDING_WIZARD).toBe(`${prefix}onboardingWizard`);
  });

  it('METRICS_OPT_IN has correct prefix', () => {
    expect(METRICS_OPT_IN).toBe(`${prefix}metricsOptIn`);
  });

  it('ANALYTICS_DATA_DELETION_TASK_ID has correct prefix', () => {
    expect(ANALYTICS_DATA_DELETION_TASK_ID).toBe(`${prefix}analyticsDataDeletionTaskId`);
  });

  it('ANALYTICS_DATA_DELETION_DATE has correct prefix', () => {
    expect(ANALYTICS_DATA_DELETION_DATE).toBe(`${prefix}analyticsDataDeletionDate`);
  });

  it('METAMETRICS_DELETION_REGULATION_ID has correct prefix', () => {
    expect(METAMETRICS_DELETION_REGULATION_ID).toBe(`${prefix}MetaMetricsDeletionRegulationId`);
  });

  it('ANALYTICS_DATA_RECORDED has correct prefix', () => {
    expect(ANALYTICS_DATA_RECORDED).toBe(`${prefix}analyticsDataRecorded`);
  });

  it('METAMETRICS_ID has correct prefix', () => {
    expect(METAMETRICS_ID).toBe(`${prefix}MetaMetricsId`);
  });

  it('MIXPANEL_METAMETRICS_ID has correct prefix (deprecated)', () => {
    expect(MIXPANEL_METAMETRICS_ID).toBe(`${prefix}MixpanelMetaMetricsId`);
  });

  it('WALLETCONNECT_SESSIONS has correct prefix', () => {
    expect(WALLETCONNECT_SESSIONS).toBe(`${prefix}walletconnectSessions`);
  });

  it('LAST_INCOMING_TX_BLOCK_INFO has correct prefix', () => {
    expect(LAST_INCOMING_TX_BLOCK_INFO).toBe(`${prefix}lastIncomingTxBlockInfo`);
  });

  it('PUSH_NOTIFICATIONS_PROMPT_COUNT has correct prefix', () => {
    expect(PUSH_NOTIFICATIONS_PROMPT_COUNT).toBe(`${prefix}pushNotificationsPromptCount`);
  });

  it('PUSH_NOTIFICATIONS_PROMPT_TIME has correct prefix', () => {
    expect(PUSH_NOTIFICATIONS_PROMPT_TIME).toBe(`${prefix}pushNotificationsPromptTime`);
  });

  it('LANGUAGE has correct prefix', () => {
    expect(LANGUAGE).toBe(`${prefix}language`);
  });

  it('ENCRYPTION_LIB has correct prefix', () => {
    expect(ENCRYPTION_LIB).toBe(`${prefix}encryptionLib`);
  });

  it('SEED_PHRASE_HINTS is seedphraseHints', () => {
    expect(SEED_PHRASE_HINTS).toBe('seedphraseHints');
  });

  it('TRUE is "true"', () => {
    expect(TRUE).toBe('true');
  });

  it('AGREED is "agreed"', () => {
    expect(AGREED).toBe('agreed');
  });

  it('DENIED is "denied"', () => {
    expect(DENIED).toBe('denied');
  });

  it('EXPLORED is "explored"', () => {
    expect(EXPLORED).toBe('explored');
  });

  it('ORIGINAL is "original"', () => {
    expect(ORIGINAL).toBe('original');
  });

  it('DEBUG has correct format', () => {
    expect(DEBUG).toBe('[MetaMask DEBUG]:');
  });

  it('LAST_APP_VERSION has correct prefix', () => {
    expect(LAST_APP_VERSION).toBe(`${prefix}LastAppVersion`);
  });

  it('CURRENT_APP_VERSION has correct prefix', () => {
    expect(CURRENT_APP_VERSION).toBe(`${prefix}CurrentAppVersion`);
  });

  it('WHATS_NEW_APP_VERSION_SEEN has correct prefix', () => {
    expect(WHATS_NEW_APP_VERSION_SEEN).toBe(`${prefix}WhatsNewAppVersionSeen`);
  });

  it('REVIEW_EVENT_COUNT is reviewEventCount', () => {
    expect(REVIEW_EVENT_COUNT).toBe('reviewEventCount');
  });

  it('REVIEW_SHOWN_TIME is reviewShownTime', () => {
    expect(REVIEW_SHOWN_TIME).toBe('reviewShownTime');
  });

  it('themeAppearanceLight is light', () => {
    expect(themeAppearanceLight).toBe('light');
  });

  it('USE_TERMS has correct prefix and version', () => {
    expect(USE_TERMS).toBe(`${prefix}UserTermsAcceptedv1.0`);
  });

  it('SOLANA_FEATURE_MODAL_SHOWN has correct prefix', () => {
    expect(SOLANA_FEATURE_MODAL_SHOWN).toBe(`${prefix}solanaFeatureModalShown`);
  });
});
