import { selectCompletedOnboarding } from '.';


describe('Onboarding selectors', () => {
  const mockState = {
    onboarding: {
      completedOnboarding: true
    }
  };

  it('returns the correct value for selectCompletedOnboarding ', () => {
    expect(selectCompletedOnboarding(mockState)).toEqual(
      mockState.onboarding.completedOnboarding
    );
  });
});