// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck - Legacy confirmations subsystem; types being incrementally added
import React from 'react';
import { shallow } from 'enzyme';
import ExpandedMessage from '.';

const renderMessageMock = jest.fn();
const toggleExpandedMessageMock = jest.fn();

describe('ExpandedMessage', () => {
  it('should render correctly', () => {
    const wrapper = shallow(
      <ExpandedMessage
        currentPageInformation={{ title: 'title', url: 'url' }}
        renderMessage={renderMessageMock}
        toggleExpandedMessageMock={toggleExpandedMessageMock}
      />,
    );
    expect(wrapper).toMatchSnapshot();
  });
});
