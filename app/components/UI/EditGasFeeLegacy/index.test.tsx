import { shallow } from 'enzyme';
import React from 'react';

import EditGasFeeLegacyImport from './';
const EditGasFeeLegacy: any = EditGasFeeLegacyImport;

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
