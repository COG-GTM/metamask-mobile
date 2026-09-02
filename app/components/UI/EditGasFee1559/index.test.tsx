import { shallow } from 'enzyme';
import React from 'react';

import EditGasFee1559Component from './';

const EditGasFee1559 = EditGasFee1559Component as unknown as React.FC<
  Partial<React.ComponentProps<typeof EditGasFee1559Component>>
>;

describe('EditGasFee1559', () => {
  it('should render correctly', () => {
    const wrapper = shallow(
      <EditGasFee1559
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
