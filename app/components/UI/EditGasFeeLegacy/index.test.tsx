import { shallow } from 'enzyme';
import React from 'react';

import EditGasFeeLegacy from './';

/** The screen requires callback props that this shallow render does not need. */
const EditGasFeeLegacyComponent = EditGasFeeLegacy as unknown as React.FC<
  Partial<React.ComponentProps<typeof EditGasFeeLegacy>>
>;

describe('EditGasFeeLegacy', () => {
  it('should render correctly', () => {
    const wrapper = shallow(
      <EditGasFeeLegacyComponent
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
