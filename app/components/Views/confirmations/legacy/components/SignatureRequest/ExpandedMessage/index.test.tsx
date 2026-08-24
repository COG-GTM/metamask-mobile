import React from 'react';
import { shallow } from 'enzyme';
import ExpandedMessage from '.';

const renderMessageMock = jest.fn();
const toggleExpandedMessageMock = jest.fn();

const props = {
  currentPageInformation: { title: 'title', url: 'url' },
  renderMessage: renderMessageMock,
  toggleExpandedMessageMock,
};

describe('ExpandedMessage', () => {
  it('should render correctly', () => {
    const wrapper = shallow(<ExpandedMessage {...props} />);
    expect(wrapper).toMatchSnapshot();
  });
});
