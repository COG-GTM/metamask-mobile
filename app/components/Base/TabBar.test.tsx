// Third party dependencies.
import React from 'react';
import { render } from '@testing-library/react-native';

// Internal dependencies.
import TabBar from './TabBar';

jest.mock('react-native-scrollable-tab-view/DefaultTabBar', () => {
  const { View } = jest.requireActual('react-native');
  const DefaultTabBar = (props: Record<string, unknown>) => (
    <View testID="default-tab-bar" {...props} />
  );
  return DefaultTabBar;
});

describe('TabBar', () => {
  it('renders the default tab bar with theme colors', () => {
    const { getByTestId, toJSON } = render(
      <TabBar
        tabs={['Tab 1', 'Tab 2']}
        activeTab={0}
        goToPage={jest.fn()}
      />,
    );
    expect(getByTestId('default-tab-bar')).toBeTruthy();
    expect(toJSON()).toMatchSnapshot();
  });
});
