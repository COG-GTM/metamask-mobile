import React from 'react';
import renderWithProvider from '../../../util/test/renderWithProvider';
import SelectComponent, { SelectOption } from './';

const options = [
  { key: 'key 1', val: 'val 1', label: 'option 1' },
  { key: 'key 2', val: 'val 2', label: 'option 2' },
] as unknown as SelectOption[];

jest.mock('../../../core/Engine', () => ({
  context: {
    colors: {},
  },
}));

describe('SelectComponent', () => {
  it('should render correctly', () => {
    const { toJSON } = renderWithProvider(
      <SelectComponent
        options={options}
        selectedValue={'val 2'}
        label={'Choose an option'}
      />,
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
