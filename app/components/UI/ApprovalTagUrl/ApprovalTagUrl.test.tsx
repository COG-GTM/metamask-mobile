import React from 'react';
import renderWithProvider from '../../../util/test/renderWithProvider';
import ApprovalTagUrl, { APPROVAL_TAG_URL_ORIGIN_PILL } from './ApprovalTagUrl';
import { backgroundState } from '../../../util/test/initial-root-state';
import { INTERNAL_ORIGINS } from '../../../constants/transaction';
import SDKConnect from '../../../core/SDKConnect/SDKConnect';

jest.mock('../../../core/SDKConnect/SDKConnect', () => {
  const mockGetConnection = jest.fn();
  return {
    __esModule: true,
    default: {
      getInstance: () => ({ getConnection: mockGetConnection }),
    },
  };
});

const mockGetConnection = SDKConnect.getInstance().getConnection as jest.Mock;

const ADDRESS_MOCK = '0x1234567890abcdef1234567890abcdef12345678';
const DOMAIN_MOCK = 'metamask.github.io';

const mockInitialState = {
  settings: {},
  engine: {
    backgroundState: {
      ...backgroundState,
      PreferencesController: {
        selectedAddress: ADDRESS_MOCK,
      },
    },
  },
};

describe('ApprovalTagUrl', () => {
  it('renders correctly', () => {
    const { toJSON, getByTestId } = renderWithProvider(
      <ApprovalTagUrl
        from={ADDRESS_MOCK}
        origin={DOMAIN_MOCK}
        url={`https://${DOMAIN_MOCK}/test-dapp/mock-url-query`}
        sdkDappMetadata={{ url: '', icon: '' }}
      />,
      { state: mockInitialState },
    );

    expect(toJSON()).toMatchSnapshot();
    expect(getByTestId(APPROVAL_TAG_URL_ORIGIN_PILL)).toBeDefined();
  });

  it('does not render when origin is an internal origin', () => {
    const { queryByTestId } = renderWithProvider(
      <ApprovalTagUrl
        from={ADDRESS_MOCK}
        origin={INTERNAL_ORIGINS[0]}
        url={`https://${INTERNAL_ORIGINS[0]}`}
        sdkDappMetadata={{ url: '', icon: '' }}
      />,
      { state: mockInitialState },
    );

    expect(queryByTestId(APPROVAL_TAG_URL_ORIGIN_PILL)).toBeNull();
  });

  it('renders origin when only origin is provided', () => {
    const { toJSON, getByTestId } = renderWithProvider(
      <ApprovalTagUrl
        from={ADDRESS_MOCK}
        origin={DOMAIN_MOCK}
        url=""
        sdkDappMetadata={{ url: '', icon: '' }}
      />,
      { state: mockInitialState },
    );

    expect(toJSON()).toMatchSnapshot();
    expect(getByTestId(APPROVAL_TAG_URL_ORIGIN_PILL)).toBeDefined();
  });

  it('labels the request with origin when url points at a different site', () => {
    const { getByText, queryByText } = renderWithProvider(
      <ApprovalTagUrl
        from={ADDRESS_MOCK}
        origin="attacker.example"
        url="https://trusted-exchange.example/trade"
        sdkDappMetadata={{ url: '', icon: '' }}
      />,
      { state: mockInitialState },
    );

    expect(getByText('https://attacker.example')).toBeDefined();
    expect(queryByText(/trusted-exchange\.example/)).toBeNull();
  });

  it('labels the request with url for MetaMask SDK channel origins', () => {
    const channelId = '6e1b8b7e-0f43-4a8c-9a3f-1f0e5c3d2b10';
    mockGetConnection.mockImplementation(
      ({ channelId: id }: { channelId: string }) =>
        id === channelId
          ? { originatorInfo: { url: 'https://sdk-dapp.example' } }
          : undefined,
    );

    const { getByText } = renderWithProvider(
      <ApprovalTagUrl
        from={ADDRESS_MOCK}
        origin={channelId}
        url="https://sdk-dapp.example"
        sdkDappMetadata={{ url: 'https://sdk-dapp.example', icon: '' }}
      />,
      { state: mockInitialState },
    );

    expect(getByText('https://sdk-dapp.example')).toBeDefined();
    mockGetConnection.mockReset();
  });
});
