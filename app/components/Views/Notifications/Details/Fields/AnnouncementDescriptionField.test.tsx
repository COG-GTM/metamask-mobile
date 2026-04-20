import React from 'react';
import { render } from '@testing-library/react-native';
import AnnouncementDescriptionField from './AnnouncementDescriptionField';
import { ModalFieldType } from '../../../../../util/notifications';

jest.mock('react-native-render-html', () => {
  const ReactModule = jest.requireActual('react');
  const { View } = jest.requireActual('react-native');
  return {
    __esModule: true,
    default: (props: { source: { html: string } }) =>
      ReactModule.createElement(
        View,
        { testID: 'html-render' },
        props.source.html,
      ),
  };
});

describe('AnnouncementDescriptionField', () => {
  const baseProps = {
    type: ModalFieldType.ANNOUNCEMENT_DESCRIPTION as const,
    description: '<p>Hello <b>World</b></p>',
  };

  it('renders correctly', () => {
    const { toJSON } = render(<AnnouncementDescriptionField {...baseProps} />);
    expect(toJSON()).toMatchSnapshot();
  });

  it('passes the html description through to the Html renderer', () => {
    const { getByTestId } = render(
      <AnnouncementDescriptionField {...baseProps} />,
    );
    expect(getByTestId('html-render')).toBeDefined();
  });
});
