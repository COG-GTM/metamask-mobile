import navigateTermsOfUse from './termsOfUse';

jest.mock('../../store/storage-wrapper', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

jest.mock('../../core/Analytics', () => ({
  MetaMetrics: {
    getInstance: () => ({
      trackEvent: jest.fn(),
    }),
  },
  MetaMetricsEvents: {
    USER_TERMS_ACCEPTED: 'USER_TERMS_ACCEPTED',
    USER_TERMS_SHOWN: 'USER_TERMS_SHOWN',
  },
}));

jest.mock('../../core/Analytics/MetricsEventBuilder', () => ({
  MetricsEventBuilder: {
    createEventBuilder: () => ({
      build: () => ({}),
    }),
  },
}));

jest.mock('./termsOfUseContent', () => '<html></html>');

jest.mock('../../../locales/i18n', () => ({
  strings: jest.fn((key) => key),
}));

jest.mock('../../../e2e/selectors/Onboarding/TermsOfUseModal.selectors', () => ({
  TermsOfUseModalSelectorsIDs: {
    CONTAINER: 'terms-container',
    ACCEPT_BUTTON: 'terms-accept',
  },
}));

jest.mock('../../constants/navigation/Routes', () => ({
  MODAL: {
    ROOT_MODAL_FLOW: 'RootModalFlow',
    MODAL_MANDATORY: 'ModalMandatory',
  },
}));

describe('termsOfUse', () => {
  it('should call navigate when terms not accepted', async () => {
    const StorageWrapper = require('../../store/storage-wrapper');
    StorageWrapper.getItem.mockResolvedValue(null);

    const navigate = jest.fn();
    await navigateTermsOfUse(navigate);
    expect(navigate).toHaveBeenCalled();
  });

  it('should not call navigate when terms already accepted', async () => {
    const StorageWrapper = require('../../store/storage-wrapper');
    StorageWrapper.getItem.mockResolvedValue('true');

    const navigate = jest.fn();
    await navigateTermsOfUse(navigate);
    expect(navigate).not.toHaveBeenCalled();
  });
});
