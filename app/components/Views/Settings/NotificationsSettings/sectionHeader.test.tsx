import React from 'react';
import { render } from '@testing-library/react-native';
import SessionHeader from './sectionHeader';
import createStyles from './NotificationsSettings.styles';
import { mockTheme } from '../../../../util/theme';

describe('SessionHeader', () => {
  const styles = createStyles({ theme: mockTheme });

  it('renders correctly with title and description', () => {
    const { toJSON } = render(
      <SessionHeader
        title="Section Title"
        description="Section description text"
        styles={styles}
      />,
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it('displays the provided title and description text', () => {
    const { getByText } = render(
      <SessionHeader
        title="My Title"
        description="My description"
        styles={styles}
      />,
    );
    expect(getByText('My Title')).toBeTruthy();
    expect(getByText('My description')).toBeTruthy();
  });

  it('renders empty strings when title and description are empty', () => {
    const { toJSON } = render(
      <SessionHeader title="" description="" styles={styles} />,
    );
    expect(toJSON()).toBeTruthy();
  });
});
