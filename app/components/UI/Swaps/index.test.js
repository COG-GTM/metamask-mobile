import React from 'react';
import renderWithProvider from

'../../../util/test/renderWithProvider';
import SwapsAmountView from './';
import { backgroundState } from '../../../util/test/initial-root-state';

import { QuoteViewSelectorIDs } from '../../../../e2e/selectors/swaps/QuoteView.selectors';

jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      setOptions: jest.fn(),
      pop: jest.fn(),
      navigate: jest.fn()
    }),
    useRoute: () => ({})
  };
});

jest.mock('../../../core/Engine', () => ({
  context: {
    SwapsController: {
      fetchAggregatorMetadataWithCache: jest.fn(),
      fetchTopAssetsWithCache: jest.fn(),
      fetchTokenWithCache: jest.fn()
    }
  }
}));

const mockInitialState = {
  engine: {
    backgroundState: {
      ...backgroundState
    }
  }
};

describe('SwapsAmountView', () => {
  it('renders', async () => {
    const { getByTestId } = renderWithProvider(<SwapsAmountView />, {
      state: mockInitialState
    });
    expect(getByTestId(QuoteViewSelectorIDs.SOURCE_TOKEN)).toBeDefined();
  });
});