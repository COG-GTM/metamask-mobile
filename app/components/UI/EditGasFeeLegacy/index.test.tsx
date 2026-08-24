import { shallow } from 'enzyme';
import React from 'react';

import EditGasFeeLegacy from './';

describe('EditGasFeeLegacy', () => {
  it('should render correctly', () => {
    const wrapper = shallow(
      <EditGasFeeLegacy
        {...({
          gasFee: {
            maxWaitTimeEstimate: 150000,
            minWaitTimeEstimate: 0,
            suggestedGasLimit: '21000',
            suggestedGasPrice: '10',
          },
          view: '',
        } as unknown as React.ComponentProps<typeof EditGasFeeLegacy>)}
      />,
    );
    expect(wrapper).toMatchSnapshot();
  });
});
