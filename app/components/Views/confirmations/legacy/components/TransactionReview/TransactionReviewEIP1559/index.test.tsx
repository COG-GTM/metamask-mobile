import React from 'react';
import TransactionReviewEIP1559 from '.';
import renderWithProvider from '../../../../../../../util/test/renderWithProvider';
import { backgroundState } from '../../../../../../../util/test/initial-root-state';

const initialState = {
  engine: {
    backgroundState,
  },
};

describe('TransactionReviewEIP1559', () => {
  it('should match snapshot', async () => {
    const container = renderWithProvider(
      <TransactionReviewEIP1559 chainId="0x1" onEdit={jest.fn()} />,
      {
        state: initialState,
      },
    );
    expect(container).toMatchSnapshot();
  });
});
