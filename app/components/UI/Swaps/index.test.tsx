import React from 'react';
import renderWithProvider, {
  DeepPartial,
} from '../../../util/test/renderWithProvider';
import SwapsAmountView from './';
import { backgroundState } from '../../../util/test/initial-root-state';
import { RootState } from '../../../reducers';
import { QuoteViewSelectorIDs } from '../../../../e2e/selectors/swaps/QuoteView.selectors';

jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      setOptions: jest.fn(),
      pop: jest.fn(),
      navigate: jest.fn(),
    }),
    useRoute: () => ({}),
  };
});

const mockTokenSelectModalProps: Record<string, unknown>[] = [];
jest.mock('./components/TokenSelectModal', () => {
  const MockTokenSelectModal = (props: Record<string, unknown>) => {
    mockTokenSelectModalProps.push(props);
    return null;
  };
  return MockTokenSelectModal;
});

jest.mock('../../../core/Engine', () => ({
  context: {
    SwapsController: {
      fetchAggregatorMetadataWithCache: jest.fn(),
      fetchTopAssetsWithCache: jest.fn(),
      fetchTokenWithCache: jest.fn(),
    },
  },
}));

const mockInitialState: DeepPartial<RootState> = {
  engine: {
    backgroundState: {
      ...backgroundState,
    },
  },
};

describe('SwapsAmountView', () => {
  it('renders', async () => {
    const { getByTestId } = renderWithProvider(<SwapsAmountView />, {
      state: mockInitialState,
    });
    expect(getByTestId(QuoteViewSelectorIDs.SOURCE_TOKEN)).toBeDefined();
  });

  it('passes stable token list props to the token select modals across re-renders', () => {
    mockTokenSelectModalProps.length = 0;
    const { rerender } = renderWithProvider(<SwapsAmountView />, {
      state: mockInitialState,
    });
    const initialRenderCount = mockTokenSelectModalProps.length;
    expect(initialRenderCount).toBeGreaterThanOrEqual(2);
    const [sourceModal, destinationModal] = mockTokenSelectModalProps.slice(
      initialRenderCount - 2,
    );

    const RerenderedView = SwapsAmountView as unknown as React.ComponentType<{
      rerenderKey: number;
    }>;
    rerender(<RerenderedView rerenderKey={1} />);

    expect(mockTokenSelectModalProps.length).toBeGreaterThan(
      initialRenderCount,
    );
    const [nextSourceModal, nextDestinationModal] =
      mockTokenSelectModalProps.slice(-2);
    expect(nextSourceModal.excludeAddresses).toBe(sourceModal.excludeAddresses);
    expect(nextSourceModal.initialTokens).toBe(sourceModal.initialTokens);
    expect(nextDestinationModal.excludeAddresses).toBe(
      destinationModal.excludeAddresses,
    );
    expect(nextDestinationModal.initialTokens).toBe(
      destinationModal.initialTokens,
    );
    expect(nextSourceModal.tokens).toBe(sourceModal.tokens);
  });
});
