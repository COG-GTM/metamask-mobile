import Routes from './Routes';

describe('Routes constants', () => {
  it('WALLET_VIEW is defined', () => {
    expect(Routes.WALLET_VIEW).toBe('WalletView');
  });

  it('BROWSER_VIEW is defined', () => {
    expect(Routes.BROWSER_VIEW).toBe('BrowserView');
  });

  it('SETTINGS_VIEW is defined', () => {
    expect(Routes.SETTINGS_VIEW).toBe('SettingsView');
  });

  it('RAMP routes are defined', () => {
    expect(Routes.RAMP.BUY).toBe('RampBuy');
    expect(Routes.RAMP.SELL).toBe('RampSell');
    expect(Routes.RAMP.BUILD_QUOTE).toBe('BuildQuote');
  });

  it('HW routes are defined', () => {
    expect(Routes.HW.CONNECT).toBe('ConnectHardwareWalletFlow');
    expect(Routes.HW.CONNECT_LEDGER).toBe('ConnectLedgerFlow');
  });

  it('MODAL routes are defined', () => {
    expect(Routes.MODAL.DELETE_WALLET).toBe('DeleteWalletModal');
    expect(Routes.MODAL.WHATS_NEW).toBe('WhatsNewModal');
    expect(Routes.MODAL.DETECTED_TOKENS).toBe('DetectedTokens');
    expect(Routes.MODAL.WALLET_ACTIONS).toBe('WalletActions');
  });

  it('ONBOARDING routes are defined', () => {
    expect(Routes.ONBOARDING.LOGIN).toBe('Login');
    expect(Routes.ONBOARDING.ONBOARDING).toBe('Onboarding');
    expect(Routes.ONBOARDING.SUCCESS).toBe('OnboardingSuccess');
  });

  it('SEND_FLOW routes are defined', () => {
    expect(Routes.SEND_FLOW.SEND_TO).toBe('SendTo');
    expect(Routes.SEND_FLOW.AMOUNT).toBe('Amount');
    expect(Routes.SEND_FLOW.CONFIRM).toBe('Confirm');
  });

  it('SETTINGS routes are defined', () => {
    expect(Routes.SETTINGS.ADVANCED_SETTINGS).toBe('AdvancedSettings');
    expect(Routes.SETTINGS.NOTIFICATIONS).toBe('NotificationsSettings');
  });

  it('SHEET routes are defined', () => {
    expect(Routes.SHEET.ACCOUNT_SELECTOR).toBe('AccountSelector');
    expect(Routes.SHEET.NETWORK_SELECTOR).toBe('NetworkSelector');
  });

  it('BROWSER routes are defined', () => {
    expect(Routes.BROWSER.HOME).toBe('BrowserTabHome');
    expect(Routes.BROWSER.VIEW).toBe('BrowserView');
  });

  it('WALLET routes are defined', () => {
    expect(Routes.WALLET.HOME).toBe('WalletTabHome');
  });

  it('BRIDGE routes are defined', () => {
    expect(Routes.BRIDGE.ROOT).toBe('Bridge');
    expect(Routes.BRIDGE.MODALS.SOURCE_TOKEN_SELECTOR).toBe('BridgeSourceTokenSelector');
  });

  it('NOTIFICATIONS routes are defined', () => {
    expect(Routes.NOTIFICATIONS.VIEW).toBe('NotificationsView');
    expect(Routes.NOTIFICATIONS.DETAILS).toBe('NotificationsDetails');
  });

  it('STAKING routes are defined', () => {
    expect(Routes.STAKING.STAKE).toBe('Stake');
    expect(Routes.STAKING.UNSTAKE).toBe('Unstake');
  });

  it('LOCK_SCREEN is defined', () => {
    expect(Routes.LOCK_SCREEN).toBe('LockScreen');
  });

  it('SWAPS is defined', () => {
    expect(Routes.SWAPS).toBe('Swaps');
  });
});
