import { RootState } from '..';

/**
 * Selector to get the infura blocked status
 */
export const getInfuraBlockedSelector = (
  state: RootState,
): boolean | undefined => state.infuraAvailability?.isBlocked;
