import {
  MetaMetrics,
  MetaMetricsEvents,
  DataDeleteStatus,
  DataDeleteResponseStatus,
  ONBOARDING_WIZARD_STEP_DESCRIPTION,
  EVENT_NAME,
} from './index';

describe('Analytics index exports', () => {
  it('exports MetaMetrics', () => {
    expect(MetaMetrics).toBeDefined();
  });

  it('exports MetaMetricsEvents', () => {
    expect(MetaMetricsEvents).toBeDefined();
  });

  it('exports DataDeleteStatus', () => {
    expect(DataDeleteStatus).toBeDefined();
  });

  it('exports DataDeleteResponseStatus', () => {
    expect(DataDeleteResponseStatus).toBeDefined();
  });

  it('exports ONBOARDING_WIZARD_STEP_DESCRIPTION', () => {
    expect(ONBOARDING_WIZARD_STEP_DESCRIPTION).toBeDefined();
  });

  it('exports EVENT_NAME', () => {
    expect(EVENT_NAME).toBeDefined();
  });
});
