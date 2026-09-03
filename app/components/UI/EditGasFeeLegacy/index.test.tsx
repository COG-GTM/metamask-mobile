import { shallow } from 'enzyme';
import React from 'react';

import EditGasFeeLegacy from './';

const TestEditGasFeeLegacy = EditGasFeeLegacy as React.ComponentType<
  Partial<React.ComponentProps<typeof EditGasFeeLegacy>>
>;

describe('EditGasFeeLegacy', () => {
  it('should render correctly', () => {
    const wrapper = shallow(
      <TestEditGasFeeLegacy
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
