import React from 'react';
import { Text } from 'react-native';
import { act, render } from '@testing-library/react-native';
import Engine from '../../../core/Engine';
import withQRHardwareAwareness from './withQRHardwareAwareness';
import { IQRState } from './types';

jest.mock('../../../core/Engine', () => ({
  context: {
    KeyringController: {
      getOrAddQRKeyring: jest.fn(),
    },
  },
  controllerMessenger: {
    subscribe: jest.fn(),
    unsubscribe: jest.fn(),
  },
}));

const QR_STATE_CHANGE_EVENT = 'KeyringController:qrKeyringStateChange';

interface InjectedProps {
  QRState?: IQRState;
  isSigningQRObject?: boolean;
  isSyncingQRHardware?: boolean;
  label?: string;
}

const mockRenderedProps = jest.fn();

class Stub extends React.Component<InjectedProps> {
  render() {
    mockRenderedProps(this.props);
    return <Text>{this.props.label}</Text>;
  }
}

const Wrapped = withQRHardwareAwareness(Stub);

const mockSubscribe = Engine.controllerMessenger.subscribe as jest.Mock;
const mockUnsubscribe = Engine.controllerMessenger.unsubscribe as jest.Mock;
const mockGetOrAddQRKeyring = Engine.context.KeyringController
  .getOrAddQRKeyring as jest.Mock;

const lastRenderedProps = (): InjectedProps =>
  mockRenderedProps.mock.calls[mockRenderedProps.mock.calls.length - 1][0];

const getSubscribedHandler = () => {
  const call = mockSubscribe.mock.calls.find(
    ([event]) => event === QR_STATE_CHANGE_EVENT,
  );
  if (!call) {
    throw new Error(`No subscription to ${QR_STATE_CHANGE_EVENT}`);
  }
  return call[1] as (state: IQRState) => void;
};

const signRequest: NonNullable<IQRState['sign']['request']> = {
  requestId: 'request-id',
  payload: { cbor: 'a1b2c3', type: 'eth-sign-request' },
};

describe('withQRHardwareAwareness', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates the QR keyring and subscribes to QR keyring state changes on mount', () => {
    render(<Wrapped />);

    expect(mockGetOrAddQRKeyring).toHaveBeenCalledTimes(1);
    expect(mockSubscribe).toHaveBeenCalledTimes(1);
    expect(mockSubscribe).toHaveBeenCalledWith(
      QR_STATE_CHANGE_EVENT,
      expect.any(Function),
    );
  });

  it('injects idle QR props before any state change and forwards own props', () => {
    const { getByText } = render(<Wrapped label="review" />);

    expect(getByText('review')).toBeTruthy();
    expect(lastRenderedProps()).toEqual({
      label: 'review',
      isSigningQRObject: false,
      isSyncingQRHardware: false,
      QRState: { sync: { reading: false }, sign: {} },
    });
  });

  it('derives isSigningQRObject and isSyncingQRHardware from published QR state', () => {
    render(<Wrapped />);
    const handler = getSubscribedHandler();

    const signingState: IQRState = {
      sync: { reading: true },
      sign: { request: signRequest },
    };
    act(() => handler(signingState));

    expect(lastRenderedProps()).toEqual({
      isSigningQRObject: true,
      isSyncingQRHardware: true,
      QRState: signingState,
    });

    const idleState: IQRState = { sync: { reading: false }, sign: {} };
    act(() => handler(idleState));

    expect(lastRenderedProps()).toEqual({
      isSigningQRObject: false,
      isSyncingQRHardware: false,
      QRState: idleState,
    });
  });

  it.each([
    {
      name: 'signing only',
      state: { sync: { reading: false }, sign: { request: signRequest } },
      isSigningQRObject: true,
      isSyncingQRHardware: false,
    },
    {
      name: 'syncing only',
      state: { sync: { reading: true }, sign: {} },
      isSigningQRObject: false,
      isSyncingQRHardware: true,
    },
  ])(
    'derives each flag from its own source ($name)',
    ({ state, isSigningQRObject, isSyncingQRHardware }) => {
      render(<Wrapped />);
      act(() => getSubscribedHandler()(state as IQRState));

      expect(lastRenderedProps()).toEqual({
        isSigningQRObject,
        isSyncingQRHardware,
        QRState: state,
      });
    },
  );

  it('does not resubscribe on re-render', () => {
    const { rerender } = render(<Wrapped label="first" />);
    rerender(<Wrapped label="second" />);
    act(() =>
      getSubscribedHandler()({
        sync: { reading: true },
        sign: {},
      }),
    );

    expect(mockGetOrAddQRKeyring).toHaveBeenCalledTimes(1);
    expect(mockSubscribe).toHaveBeenCalledTimes(1);
    expect(mockUnsubscribe).not.toHaveBeenCalled();
  });

  it('unsubscribes the same handler on unmount', () => {
    const { unmount } = render(<Wrapped />);
    const handler = getSubscribedHandler();

    expect(mockUnsubscribe).not.toHaveBeenCalled();
    unmount();

    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
    expect(mockUnsubscribe).toHaveBeenCalledWith(
      QR_STATE_CHANGE_EVENT,
      handler,
    );
  });
});
