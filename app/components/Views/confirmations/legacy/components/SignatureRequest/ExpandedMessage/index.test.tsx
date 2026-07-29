import React from 'react';
import { shallow } from 'enzyme';
import ExpandedMessage from '.';

const renderMessageMock = jest.fn();
const toggleExpandedMessageMock = jest.fn();

// `toggleExpandedMessageMock` is not a prop of `ExpandedMessage`; spread so the
// props passed at runtime stay exactly the same
const extraProps = {
  toggleExpandedMessageMock,
} as unknown as Partial<React.ComponentProps<typeof ExpandedMessage>>;

describe('ExpandedMessage', () => {
  it('should render correctly', () => {
    const wrapper = shallow(
      <ExpandedMessage
        currentPageInformation={{ title: 'title', url: 'url' }}
        renderMessage={renderMessageMock}
        {...extraProps}
      />,
    );
    expect(wrapper).toMatchSnapshot();
  });
});
