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

  it('labels the pill with the request origin when url points elsewhere', () => {
    const { getByText, queryByText } = renderWithProvider(
      <ApprovalTagUrl
        from={ADDRESS_MOCK}
        origin="evil.example"
        url="https://trusted.example/swap"
        sdkDappMetadata={{ url: '', icon: '' }}
      />,
      { state: mockInitialState },
    );

    expect(getByText('https://evil.example')).toBeDefined();
    expect(queryByText('https://trusted.example')).toBeNull();
  });

  it('uses the SDK dapp url when the origin is an SDK channel id', () => {
    const { getByText } = renderWithProvider(
      <ApprovalTagUrl
        from={ADDRESS_MOCK}
        origin="0b6f2e5a-4c1d-4e8b-9f3a-2d7c6b5a4e3f"
        url="https://sdk-dapp.example"
        sdkDappMetadata={{ url: 'https://sdk-dapp.example', icon: '' }}
      />,
      { state: mockInitialState },
    );

    expect(getByText('https://sdk-dapp.example')).toBeDefined();
  });
});
