import type {
  EnableMetametricsReturn,
  DisableMetametricsReturn,
  AccountType,
  SwitchSnapNotificationsChangeReturn,
  SwitchFeatureAnnouncementsChangeReturn,
  SwitchPushNotificationsReturn,
  UseSwitchAccountNotificationsData,
  SwitchAccountNotificationsReturn,
  SwitchAccountNotificationsChangeReturn,
} from './types';

describe('notification hooks types', () => {
  it('EnableMetametricsReturn has expected shape', () => {
    const mock: EnableMetametricsReturn = {
      enableMetametrics: jest.fn().mockResolvedValue(undefined),
      loading: false,
    };
    expect(mock.loading).toBe(false);
    expect(typeof mock.enableMetametrics).toBe('function');
  });

  it('DisableMetametricsReturn has expected shape', () => {
    const mock: DisableMetametricsReturn = {
      disableMetametrics: jest.fn().mockResolvedValue(undefined),
      loading: false,
    };
    expect(mock.loading).toBe(false);
    expect(typeof mock.disableMetametrics).toBe('function');
  });

  it('SwitchSnapNotificationsChangeReturn has expected shape', () => {
    const mock: SwitchSnapNotificationsChangeReturn = {
      onChange: jest.fn(),
    };
    expect(typeof mock.onChange).toBe('function');
  });

  it('SwitchFeatureAnnouncementsChangeReturn has expected shape', () => {
    const mock: SwitchFeatureAnnouncementsChangeReturn = {
      onChange: jest.fn(),
    };
    expect(typeof mock.onChange).toBe('function');
  });

  it('SwitchPushNotificationsReturn has expected shape', () => {
    const mock: SwitchPushNotificationsReturn = {
      onChange: jest.fn(),
    };
    expect(typeof mock.onChange).toBe('function');
  });

  it('UseSwitchAccountNotificationsData has expected shape', () => {
    const mock: UseSwitchAccountNotificationsData = {
      '0x123': true,
      '0x456': false,
    };
    expect(mock['0x123']).toBe(true);
    expect(mock['0x456']).toBe(false);
  });

  it('SwitchAccountNotificationsReturn has expected shape', () => {
    const mock: SwitchAccountNotificationsReturn = {
      switchAccountNotifications: jest.fn().mockResolvedValue(undefined),
      isLoading: false,
    };
    expect(mock.isLoading).toBe(false);
    expect(typeof mock.switchAccountNotifications).toBe('function');
  });

  it('SwitchAccountNotificationsChangeReturn has expected shape', () => {
    const mock: SwitchAccountNotificationsChangeReturn = {
      onChange: jest.fn(),
    };
    expect(typeof mock.onChange).toBe('function');
  });

  it('EnableMetametricsReturn supports optional error', () => {
    const mock: EnableMetametricsReturn = {
      enableMetametrics: jest.fn().mockResolvedValue(undefined),
      loading: false,
      error: 'some error',
    };
    expect(mock.error).toBe('some error');
  });
});
