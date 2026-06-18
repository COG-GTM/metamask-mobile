/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-shadow, @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-unused-vars, import/no-commonjs, @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires */
import { shallow } from 'enzyme';
import React from 'react';

const EditGasFeeLegacy: any = require('./').default;

describe('EditGasFeeLegacy', () => {
  it('should render correctly', () => {
    const wrapper = shallow(
      <EditGasFeeLegacy
        gasFee={{
          maxWaitTimeEstimate: 150000,
          minWaitTimeEstimate: 0,
          suggestedGasLimit: '21000',
          suggestedGasPrice: '10',
        }}
        view={''}
      />,
    );
    expect(wrapper).toMatchSnapshot();
  });
});
