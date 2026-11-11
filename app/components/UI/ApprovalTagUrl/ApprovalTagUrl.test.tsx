import React from 'react';
import renderWithProvider from '../../../util/test/renderWithProvider';
import ApprovalTagUrl, { APPROVAL_TAG_URL_ORIGIN_PILL } from './ApprovalTagUrl';
import { backgroundState } from '../../../util/test/initial-root-state';
import { INTERNAL_ORIGINS } from '../../../constants/transaction';

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

  it('labels the request with its origin, not an unrelated tab url', () => {
    const { getByText, queryByText } = renderWithProvider(
      <ApprovalTagUrl
        from={ADDRESS_MOCK}
        origin="evil.example"
        url="https://trusted-exchange.example"
        sdkDappMetadata={{ url: '', icon: '' }}
      />,
      { state: mockInitialState },
    );

    expect(getByText('https://evil.example')).toBeDefined();
    expect(queryByText('https://trusted-exchange.example')).toBeNull();
  });

  it('keeps the origin label when the url changes while open', () => {
    const { getByText, queryByText, rerender } = renderWithProvider(
      <ApprovalTagUrl
        from={ADDRESS_MOCK}
        origin="evil.example"
        url="https://evil.example/approve"
        sdkDappMetadata={{ url: '', icon: '' }}
      />,
      { state: mockInitialState },
    );
    expect(getByText('https://evil.example')).toBeDefined();

    rerender(
      <ApprovalTagUrl
        from={ADDRESS_MOCK}
        origin="evil.example"
        url="https://trusted-exchange.example"
        sdkDappMetadata={{ url: '', icon: '' }}
      />,
    );

    expect(getByText('https://evil.example')).toBeDefined();
    expect(queryByText('https://trusted-exchange.example')).toBeNull();
  });

  it('uses the host of a WalletConnect URL origin', () => {
    const { getByText } = renderWithProvider(
      <ApprovalTagUrl
        from={ADDRESS_MOCK}
        origin="https://game.example"
        url="https://trusted-exchange.example"
      />,
      { state: mockInitialState },
    );

    expect(getByText('https://game.example')).toBeDefined();
  });

  it('uses the SDK dapp url resolved for the origin connection', () => {
    const { getByText } = renderWithProvider(
      <ApprovalTagUrl
        from={ADDRESS_MOCK}
        origin="5a8b3c0e-1d2f-4a6b-9c7d-0e1f2a3b4c5d"
        url="https://sdk-dapp.example"
        sdkDappMetadata={{ url: 'https://sdk-dapp.example', icon: '' }}
      />,
      { state: mockInitialState },
    );

    expect(getByText('https://sdk-dapp.example')).toBeDefined();
  });
});
