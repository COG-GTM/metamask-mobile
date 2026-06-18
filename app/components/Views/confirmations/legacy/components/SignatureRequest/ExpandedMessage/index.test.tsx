import React from 'react';
import { shallow } from 'enzyme';
import ExpandedMessage from '.';

const renderMessageMock = jest.fn();
const toggleExpandedMessageMock = jest.fn();

describe('ExpandedMessage', () => {
  it('should render correctly', () => {
    const wrapper = shallow(
      // @ts-expect-error ExpandedMessage default export is the Props type, not the class (broken by JS->TS migration in a file outside this task's scope) - TS2693
      <ExpandedMessage
        currentPageInformation={{ title: 'title', url: 'url' }}
        renderMessage={renderMessageMock}
        toggleExpandedMessageMock={toggleExpandedMessageMock}
      />,
    );
    expect(wrapper).toMatchSnapshot();
  });
});
