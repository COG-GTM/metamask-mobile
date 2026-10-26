import navigateTermsOfUse from './termsOfUse';
import StorageWrapper from '../../store/storage-wrapper';
import Routes from '../../constants/navigation/Routes';
import { TRUE, USE_TERMS } from '../../constants/storage';
import { MetaMetrics, MetaMetricsEvents } from '../../core/Analytics';

const mockTrackEvent = jest.fn();

jest.mock('../../core/Analytics', () => ({
  ...jest.requireActual('../../core/Analytics'),
  MetaMetrics: { getInstance: jest.fn() },
}));

jest.mock('./termsOfUseContent', () => '<html>terms</html>', {
  virtual: true,
});

describe('navigateTermsOfUse', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (MetaMetrics.getInstance as jest.Mock).mockReturnValue({
      trackEvent: mockTrackEvent,
    });
  });

  it('does not navigate when terms were already accepted', async () => {
    (StorageWrapper.getItem as jest.Mock).mockResolvedValue(TRUE);
    const navigate = jest.fn();
    await navigateTermsOfUse(navigate);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('navigates to the mandatory modal when terms were not accepted', async () => {
    (StorageWrapper.getItem as jest.Mock).mockResolvedValue(undefined);
    const navigate = jest.fn();
    await navigateTermsOfUse(navigate);

    expect(navigate).toHaveBeenCalledWith(
      Routes.MODAL.ROOT_MODAL_FLOW,
      expect.objectContaining({ screen: Routes.MODAL.MODAL_MANDATORY }),
    );
    const { params } = navigate.mock.calls[0][1];
    expect(params.body).toEqual({
      source: 'WebView',
      html: '<html>terms</html>',
    });
    expect(params.isScrollToEndNeeded).toBe(true);

    params.onRender();
    expect(mockTrackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        name: MetaMetricsEvents.USER_TERMS_SHOWN.category,
      }),
    );

    await params.onAccept();
    expect(StorageWrapper.setItem).toHaveBeenCalledWith(USE_TERMS, TRUE);
    expect(mockTrackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        name: MetaMetricsEvents.USER_TERMS_ACCEPTED.category,
      }),
    );
  });
});
