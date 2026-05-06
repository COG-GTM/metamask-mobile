import React from 'react';
import TransactionReviewEIP1559Import from '.';
const TransactionReviewEIP1559: any = TransactionReviewEIP1559Import;
import renderWithProvider from '../../../../../../../util/test/renderWithProvider';
import { backgroundState } from '../../../../../../../util/test/initial-root-state';

const initialState = {
  engine: {
    backgroundState,
  },
};

describe('TransactionReviewEIP1559', () => {
  it('should match snapshot', async () => {
    const container = renderWithProvider(<TransactionReviewEIP1559 />, {
      state: initialState,
    });
    expect(container).toMatchSnapshot();
  });
});
