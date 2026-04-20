import React from 'react';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import { fireEvent, render } from '@testing-library/react-native';
import { backgroundState } from '../../../../util/test/initial-root-state';
import { TokenButton } from './TokenButton';

jest.mock('../../../hooks/useIpfsGateway', () => jest.fn(() => 'https://dweb.link/ipfs/'));

const mockStore = configureMockStore();
const mockState = {
  settings: {},
  engine: { backgroundState },
};
const store = mockStore(mockState);

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn().mockImplementation((cb) => cb(mockState)),
}));

const renderButton = (props: React.ComponentProps<typeof TokenButton> = {}) =>
  render(
    <Provider store={store}>
      <TokenButton {...props} />
    </Provider>,
  );

describe('TokenButton', () => {
  it('matches snapshot with symbol and network info', () => {
    const { toJSON } = renderButton({
      symbol: 'ETH',
      iconUrl: 'https://example.com/eth.png',
      networkName: 'Ethereum',
    });
    expect(toJSON()).toMatchSnapshot();
  });

  it('renders the token symbol', () => {
    const { getByText } = renderButton({
      symbol: 'USDC',
      networkName: 'Ethereum',
    });
    expect(getByText('USDC')).toBeTruthy();
  });

  it('invokes onPress when tapped', () => {
    const onPress = jest.fn();
    const { getByTestId } = renderButton({
      symbol: 'ETH',
      networkName: 'Ethereum',
      testID: 'token-button',
      onPress,
    });
    fireEvent.press(getByTestId('token-button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('renders without symbol or network props', () => {
    const { toJSON } = renderButton();
    expect(toJSON()).toBeTruthy();
  });
});
