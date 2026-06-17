import React from 'react';
import { shallow } from 'enzyme';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import NavbarTitleComponent from './';

const NavbarTitle = NavbarTitleComponent as unknown as React.ComponentType<{
  title?: string;
}>;

const mockStore = configureMockStore();
const store = mockStore({});

describe('NavbarTitle', () => {
  it('should render correctly', () => {
    const title = 'Test';
    const wrapper = shallow(
      <Provider store={store}>
        <NavbarTitle title={title} />
      </Provider>,
    );
    expect(wrapper).toMatchSnapshot();
  });
});
