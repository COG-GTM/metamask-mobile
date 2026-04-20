import React from 'react';
import { render } from '@testing-library/react-native';
import AccountAction from './AccountAction';
import { IconName } from '../../../component-library/components/Icons/Icon';

jest.mock('../../../component-library/hooks', () => ({
  useStyles: () => ({
    styles: {
      base: {},
      icon: {},
      descriptionLabel: {},
    },
  }),
}));

describe('AccountAction', () => {
  it('renders correctly with required props', () => {
    const { toJSON } = render(
      <AccountAction actionTitle="Send" iconName={IconName.Send} />,
    );
    expect(toJSON()).toBeTruthy();
  });

  it('renders the action title text', () => {
    const { getByText } = render(
      <AccountAction actionTitle="Receive" iconName={IconName.Receive} />,
    );
    expect(getByText('Receive')).toBeDefined();
  });

  it('renders in disabled state', () => {
    const { toJSON } = render(
      <AccountAction actionTitle="Send" iconName={IconName.Send} disabled />,
    );
    expect(toJSON()).toBeTruthy();
  });

  it('matches snapshot', () => {
    const { toJSON } = render(
      <AccountAction actionTitle="Send" iconName={IconName.Send} />,
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
