import React from 'react';
import GraphTooltip from '.';
import renderWithProvider from '../../../../../../../util/test/renderWithProvider';

describe('GraphTooltip', () => {
  it('render matches snapshot', () => {
    const props = {
      title: 'Sample Title',
      subtitle: 'Sample Subtitle',
      color: 'blue'
    };

    const { toJSON } = renderWithProvider(<GraphTooltip {...props} />);

    expect(toJSON()).toMatchSnapshot();
  });
});