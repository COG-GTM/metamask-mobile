import React from 'react';
import renderWithProvider from '../../../../../../util/test/renderWithProvider';
import AccountTag from './AccountTag';


describe('AccountTag', () => {
  it('render matches snapshot when name prop is defined', () => {
    const props = {
      accountAddress: '0x1',
      accountName: 'Sample Contract'
    };

    const { getByText, toJSON } = renderWithProvider(<AccountTag {...props} />);

    expect(getByText(props.accountName)).toBeDefined();

    expect(toJSON()).toMatchSnapshot();
  });

  it("render matches snapshot when name prop isn't defined", () => {
    const props = {
      accountAddress: '0x1'
    };

    const { getByText, toJSON } = renderWithProvider(<AccountTag {...props} />);

    expect(getByText(props.accountAddress)).toBeDefined();

    expect(toJSON()).toMatchSnapshot();
  });
});