import React from 'react';
import renderWithProvider from '../../../util/test/renderWithProvider';
import { BridgeScreenStack, BridgeModalStack } from './routes';

jest.mock('./components/BridgeDestTokenSelector', () => ({
  BridgeDestTokenSelector: () => null,
}));
jest.mock('./components/BridgeSourceTokenSelector', () => ({
  BridgeSourceTokenSelector: () => null,
}));
jest.mock('./components/SlippageModal', () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock('./components/BridgeSourceNetworkSelector', () => ({
  BridgeSourceNetworkSelector: () => null,
}));
jest.mock('./components/BridgeDestNetworkSelector', () => ({
  BridgeDestNetworkSelector: () => null,
}));
jest.mock('./components/QuoteInfoModal', () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock('./Views/BridgeView', () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock('./components/TransactionDetails/BlockExplorersModal', () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock('./components/QuoteExpiredModal', () => ({
  __esModule: true,
  default: () => null,
}));

describe('Bridge routes', () => {
  it('BridgeScreenStack renders without crashing', () => {
    const { toJSON } = renderWithProvider(<BridgeScreenStack />);
    expect(toJSON()).toBeTruthy();
  });

  it('BridgeModalStack renders without crashing', () => {
    const { toJSON } = renderWithProvider(<BridgeModalStack />);
    expect(toJSON()).toBeTruthy();
  });
});
