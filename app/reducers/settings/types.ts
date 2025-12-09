import { type PrimaryCurrency, type TokenSortConfig } from '../../actions/settings/types';

/**
 * Settings state interface
 */
export interface SettingsState {
  searchEngine: string;
  primaryCurrency: PrimaryCurrency;
  lockTime: number;
  useBlockieIcon: boolean;
  hideZeroBalanceTokens: boolean;
  basicFunctionalityEnabled: boolean;
  showHexData?: boolean;
  showCustomNonce?: boolean;
  showFiatOnTestnets?: boolean;
  deviceNotificationEnabled?: boolean;
  tokenSortConfig?: TokenSortConfig;
}
