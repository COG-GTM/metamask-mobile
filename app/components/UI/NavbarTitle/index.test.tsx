import React from 'react';
import { shallow } from 'enzyme';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import NavbarTitle from './';

const mockStore = configureMockStore();
const store = mockStore({});

// `NavbarTitle` is still JavaScript, so its inferred props type is not usable.
const NavbarTitleComponent = NavbarTitle as unknown as React.ComponentType<{
  title: string;
}>;

describe('NavbarTitle', () => {
  it('should render correctly', () => {
    const title = 'Test';
    const wrapper = shallow(
      <Provider store={store}>
        <NavbarTitleComponent title={title} />
      </Provider>,
    );
    expect(wrapper).toMatchSnapshot();
  });
});
