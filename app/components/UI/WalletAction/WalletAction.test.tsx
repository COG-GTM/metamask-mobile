import React from 'react';
import { render } from '@testing-library/react-native';
import WalletAction from './WalletAction';
import { WalletActionType } from './WalletAction.types';
import { IconName } from '../../../component-library/components/Icons/Icon';
import { AvatarSize } from '../../../component-library/components/Avatars/Avatar';

jest.mock('../../../component-library/hooks', () => ({
  useStyles: () => ({
    styles: {
      base: {},
      disabled: {},
      descriptionLabel: {},
    },
  }),
}));

describe('WalletAction', () => {
  const defaultProps = {
    actionType: WalletActionType.Send,
    iconName: IconName.Send,
    iconSize: AvatarSize.Md,
    onPress: jest.fn(),
  };

  it('renders correctly', () => {
    const { toJSON } = render(<WalletAction {...defaultProps} />);
    expect(toJSON()).toBeTruthy();
  });

  it('renders Buy action type', () => {
    const { toJSON } = render(
      <WalletAction {...defaultProps} actionType={WalletActionType.Buy} />,
    );
    expect(toJSON()).toBeTruthy();
  });

  it('renders Swap action type', () => {
    const { toJSON } = render(
      <WalletAction {...defaultProps} actionType={WalletActionType.Swap} />,
    );
    expect(toJSON()).toBeTruthy();
  });

  it('renders in disabled state', () => {
    const { toJSON } = render(
      <WalletAction {...defaultProps} disabled />,
    );
    expect(toJSON()).toBeTruthy();
  });

  it('matches snapshot', () => {
    const { toJSON } = render(<WalletAction {...defaultProps} />);
    expect(toJSON()).toMatchSnapshot();
  });
});
