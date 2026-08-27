import React from 'react';
import renderWithProvider from '../../../../../../../util/test/renderWithProvider';
import ApprovalFlowLoader from '.';

describe('ApprovalFlowLoader', () => {
  it('should render correctly', () => {
    // @ts-expect-error -- legacy JavaScript UI type boundary
    const { toJSON } = renderWithProvider(<ApprovalFlowLoader />);
    expect(toJSON()).toMatchSnapshot();
  });
});
