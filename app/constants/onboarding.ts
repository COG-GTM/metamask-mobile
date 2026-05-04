import { strings } from '../../locales/i18n';

export const CHOOSE_PASSWORD_STEPS = [
  strings('choose_password.title'),
  strings('choose_password.secure'),
  strings('choose_password.confirm'),
] as const;

export const MANUAL_BACKUP_STEPS = [
  strings('manual_backup.progressOne'),
  strings('manual_backup.progressTwo'),
  strings('manual_backup.progressThree'),
] as const;

export const WRONG_PASSWORD_ERROR = 'Error: Decrypt failed' as const;
export const SEED_PHRASE = 'seed_phrase' as const;
export const CONFIRM_PASSWORD = 'confirm_password' as const;
