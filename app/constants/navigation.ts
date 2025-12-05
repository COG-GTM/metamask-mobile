export const PREVIOUS_SCREEN = 'previous_screen' as const;
export const ONBOARDING = 'onboarding' as const;
export const PROTECT = 'protect' as const;

export type NavigationConstant =
  | typeof PREVIOUS_SCREEN
  | typeof ONBOARDING
  | typeof PROTECT;
