import React from 'react';
import { shallow } from 'enzyme';
import ExpandedMessage from '.';

const renderMessageMock = jest.fn();
const toggleExpandedMessageMock = jest.fn();

describe('ExpandedMessage', () => {
  it('should render correctly', () => {
    const wrapper = shallow(
      <ExpandedMessage
        // @ts-expect-error -- legacy JavaScript UI type boundary
        currentPageInformation={{ title: 'title', url: 'url' }}
        renderMessage={renderMessageMock}
        toggleExpandedMessageMock={toggleExpandedMessageMock}
      />,
    );
    expect(wrapper).toMatchSnapshot();
  });
});
