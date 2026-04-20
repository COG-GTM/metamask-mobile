import Routes from '../../constants/navigation/Routes';
import StorageWrapper from '../../store/storage-wrapper';
import { MetaMetrics } from '../../core/Analytics';
import navigateTermsOfUse from './termsOfUse';

jest.mock(
  './termsOfUseContent',
  () => ({ __esModule: true, default: '<html>terms</html>' }),
  { virtual: true },
);

jest.mock('../../store/storage-wrapper', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
  },
}));

jest.mock('../../core/Analytics', () => ({
  MetaMetrics: {
    getInstance: jest.fn(() => ({ trackEvent: jest.fn() })),
  },
  MetaMetricsEvents: {
    USER_TERMS_ACCEPTED: 'USER_TERMS_ACCEPTED',
    USER_TERMS_SHOWN: 'USER_TERMS_SHOWN',
  },
}));

jest.mock('../../core/Analytics/MetricsEventBuilder', () => ({
  MetricsEventBuilder: {
    createEventBuilder: jest.fn(() => ({ build: jest.fn(() => ({})) })),
  },
}));

const mockedGetItem = StorageWrapper.getItem as jest.Mock;
const mockedSetItem = StorageWrapper.setItem as jest.Mock;
const mockedGetInstance = MetaMetrics.getInstance as jest.Mock;

describe('navigateTermsOfUse', () => {
  beforeEach(() => {
    mockedGetItem.mockReset();
    mockedSetItem.mockReset();
  });

  it('does nothing when terms have already been accepted', async () => {
    mockedGetItem.mockResolvedValue('true');
    const navigate = jest.fn();
    await navigateTermsOfUse(navigate);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('navigates to the modal flow and wires up onAccept + onRender handlers', async () => {
    mockedGetItem.mockResolvedValue(null);
    const trackEvent = jest.fn();
    mockedGetInstance.mockReturnValue({ trackEvent });

    const navigate = jest.fn();
    await navigateTermsOfUse(navigate);

    expect(navigate).toHaveBeenCalledTimes(1);
    const [route, { screen, params }] = navigate.mock.calls[0];
    expect(route).toBe(Routes.MODAL.ROOT_MODAL_FLOW);
    expect(screen).toBe(Routes.MODAL.MODAL_MANDATORY);
    expect(params.body.source).toBe('WebView');
    expect(typeof params.onAccept).toBe('function');
    expect(typeof params.onRender).toBe('function');

    await params.onAccept();
    expect(mockedSetItem).toHaveBeenCalledWith(expect.any(String), 'true');

    params.onRender();
    expect(trackEvent).toHaveBeenCalled();
  });
});
