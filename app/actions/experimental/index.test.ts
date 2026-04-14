import { ActionType } from '.';

describe('Experimental Actions', () => {
  it('should export SET_SECURITY_ALERTS_ENABLED action type', () => {
    expect(ActionType.SET_SECURITY_ALERTS_ENABLED).toBe('SET_SECURITY_ALERTS_ENABLED');
  });

  it('should export SET_PPOM_INITIALIZATION_STATUS action type', () => {
    expect(ActionType.SET_PPOM_INITIALIZATION_STATUS).toBe('SET_PPOM_INITIALIZATION_STATUS');
  });
});
