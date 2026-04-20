import React from 'react';
import { render } from '@testing-library/react-native';
import {
  IconName,
  IconSize,
} from '../../../component-library/components/Icons/Icon';
import { SnapUIIcon } from './SnapUIIcon';

describe('SnapUIIcon', () => {
  it('renders without crashing with a given name', () => {
    const { toJSON } = render(
      <SnapUIIcon name={IconName.Add} size={IconSize.Md} />,
    );
    expect(toJSON()).toBeTruthy();
  });

  it('matches snapshot for a large warning icon', () => {
    const { toJSON } = render(
      <SnapUIIcon name={IconName.Warning} size={IconSize.Lg} />,
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
