import { shallow } from 'enzyme';
import React from 'react';

import EditGasFee1559 from './';

const TestEditGasFee1559 = EditGasFee1559 as React.ComponentType<
  Partial<React.ComponentProps<typeof EditGasFee1559>>
>;

describe('EditGasFee1559', () => {
  it('should render correctly', () => {
    const wrapper = shallow(
      <TestEditGasFee1559
        gasFee={{
          maxWaitTimeEstimate: 150000,
          minWaitTimeEstimate: 0,
          suggestedMaxFeePerGas: '50',
          suggestedMaxPriorityFeePerGas: '2',
        }}
        view={''}
      />,
    );
    expect(wrapper).toMatchSnapshot();
  });
});
