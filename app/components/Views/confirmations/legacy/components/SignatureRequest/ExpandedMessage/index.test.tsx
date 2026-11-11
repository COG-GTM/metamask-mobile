import React from 'react';
import { shallow } from 'enzyme';
import ExpandedMessage from '.';
import renderWithProvider from '../../../../../../../util/test/renderWithProvider';
import { backgroundState } from '../../../../../../../util/test/initial-root-state';
import SDKConnect from '../../../../../../../core/SDKConnect/SDKConnect';

jest.mock('../../../../../../../core/SDKConnect/SDKConnect', () => ({
  __esModule: true,
  default: { getInstance: jest.fn() },
}));

const mockGetConnection = jest.fn();
(SDKConnect.getInstance as jest.Mock).mockReturnValue({
  getConnection: mockGetConnection,
});

const renderMessageMock = jest.fn();
const toggleExpandedMessageMock = jest.fn();

describe('ExpandedMessage', () => {
  it('should render correctly', () => {
    const wrapper = shallow(
      <ExpandedMessage
        currentPageInformation={{ title: 'title', url: 'url' }}
        renderMessage={renderMessageMock}
        toggleExpandedMessageMock={toggleExpandedMessageMock}
      />,
    );
    expect(wrapper).toMatchSnapshot();
  });
});

describe('ExpandedMessage unverified SDK origin', () => {
  const sdkChannelId = 'f5d5d2f0-7b8a-4a8c-9f0b-6f6d1f3d2c11';
  const declaredIcon = 'https://swap.example/logo.png';
  const unverifiedText =
    "Site reported by the requesting app. MetaMask can't verify it.";

  beforeEach(() => {
    mockGetConnection.mockImplementation(({ channelId }) =>
      channelId === sdkChannelId ? { originatorInfo: {} } : undefined,
    );
  });

  const renderExpanded = (channelId?: string) =>
    renderWithProvider(
      <ExpandedMessage
        currentPageInformation={{
          title: 'Swap',
          url: 'https://swap.example',
          icon: declaredIcon,
          channelId,
        }}
        renderMessage={() => null}
        toggleExpandedMessage={toggleExpandedMessageMock}
      />,
      { state: { engine: { backgroundState } } },
    );

  it('labels SDK requests as unverified and hides the declared icon', () => {
    const { getByText, UNSAFE_root } = renderExpanded(sdkChannelId);
    expect(getByText(unverifiedText)).toBeTruthy();
    const imageUris = UNSAFE_root.findAll(
      (node) => node.props?.source?.uri !== undefined,
    ).map((node) => node.props.source.uri);
    expect(imageUris).not.toContain(declaredIcon);
  });

  it('does not label browser requests as unverified', () => {
    const { queryByText } = renderExpanded(undefined);
    expect(queryByText(unverifiedText)).toBeNull();
  });
});
