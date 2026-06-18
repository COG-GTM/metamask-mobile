/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-shadow, @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-unused-vars, import/no-commonjs, @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires */
import React from 'react';
const WebviewProgressBar: any = require('./').default;
import renderWithProvider from '../../../util/test/renderWithProvider';

describe('WebviewProgressBar', () => {
  it('should render correctly', () => {
    const { toJSON } = renderWithProvider(<WebviewProgressBar />);
    expect(toJSON()).toMatchSnapshot();
  });
});
