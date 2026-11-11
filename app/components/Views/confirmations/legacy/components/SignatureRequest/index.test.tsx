import React from 'react';
import { shallow } from 'enzyme';
import SignatureRequest from '.';
import configureMockStore from 'redux-mock-store';
import { Provider } from 'react-redux';
import { backgroundState } from '../../../../../../util/test/initial-root-state';
import renderWithProvider from '../../../../../../util/test/renderWithProvider';
import { SDKConnect } from '../../../../../../core/SDKConnect/SDKConnect';

jest.mock('../../../../../../core/SDKConnect/SDKConnect', () => ({
  SDKConnect: {
    getInstance: jest.fn(),
  },
}));

jest.mock('../../../../../UI/AccountInfoCard', () => () => null);
jest.mock(
  '../../../../../UI/QRHardware/withQRHardwareAwareness',
  () =>
    (Component: React.ComponentType<Record<string, unknown>>) =>
    (props: Record<string, unknown>) =>
      <Component {...props} />,
);
jest.mock('../../../../../../util/address', () => ({
  ...jest.requireActual('../../../../../../util/address'),
  isHardwareAccount: () => false,
}));
jest.mock('../../../../../../util/confirmation/signatureUtils', () => ({
  ...jest.requireActual('../../../../../../util/confirmation/signatureUtils'),
  getAnalyticsParams: () => ({}),
}));

const mockGetConnections = jest.fn();
(SDKConnect.getInstance as jest.Mock).mockReturnValue({
  getConnections: mockGetConnections,
});

const mockStore = configureMockStore();
const initialState = {
  engine: {
    backgroundState,
  },
};
const store = mockStore(initialState);

describe('SignatureRequest', () => {
  it('should render correctly', () => {
    const wrapper = shallow(
      <Provider store={store}>
        <SignatureRequest
          currentPageInformation={{ title: 'title', url: 'url' }}
        />
      </Provider>,
    );
    expect(wrapper).toMatchSnapshot();
  });
});

describe('SignatureRequest unverified SDK origin', () => {
  const sdkChannelId = 'f5d5d2f0-7b8a-4a8c-9f0b-6f6d1f3d2c11';
  const declaredIcon = 'https://swap.example/logo.png';

  const renderRequest = (channelId?: string) =>
    renderWithProvider(
      <SignatureRequest
        currentPageInformation={{
          title: 'Swap',
          url: 'https://swap.example',
          icon: declaredIcon,
          channelId,
        }}
        fromAddress="0x0000000000000000000000000000000000000001"
      />,
      { state: initialState },
    );

  beforeEach(() => {
    mockGetConnections.mockReturnValue({
      [sdkChannelId]: {
        originatorInfo: { url: 'https://swap.example', icon: declaredIcon },
      },
    });
  });

  it('labels the declared site as unverified for an SDK connection', () => {
    const { getByText } = renderRequest(sdkChannelId);
    expect(
      getByText(
        "Site reported by the requesting app. MetaMask can't verify it.",
      ),
    ).toBeTruthy();
  });

  it('does not label browser requests as unverified', () => {
    const { queryByText } = renderRequest(undefined);
    expect(
      queryByText(
        "Site reported by the requesting app. MetaMask can't verify it.",
      ),
    ).toBeNull();
  });
});
