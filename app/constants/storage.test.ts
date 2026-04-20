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

  it('all prefixed constants use the correct prefix', () => {
    const prefixedConstants = [
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
      LAST_APP_VERSION,
      CURRENT_APP_VERSION,
      WHATS_NEW_APP_VERSION_SEEN,
      USE_TERMS,
      SOLANA_FEATURE_MODAL_SHOWN,
    ];
    prefixedConstants.forEach((constant) => {
      expect(constant).toMatch(new RegExp(`^${prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
    });
  });

  it('exports non-prefixed constants', () => {
    expect(SEED_PHRASE_HINTS).toBe('seedphraseHints');
    expect(TRUE).toBe('true');
    expect(AGREED).toBe('agreed');
    expect(DENIED).toBe('denied');
    expect(EXPLORED).toBe('explored');
    expect(ORIGINAL).toBe('original');
    expect(REVIEW_EVENT_COUNT).toBe('reviewEventCount');
    expect(REVIEW_SHOWN_TIME).toBe('reviewShownTime');
    expect(themeAppearanceLight).toBe('light');
  });

  it('exports DEBUG with MetaMask prefix', () => {
    expect(DEBUG).toContain('MetaMask');
    expect(DEBUG).toContain('DEBUG');
  });
});
