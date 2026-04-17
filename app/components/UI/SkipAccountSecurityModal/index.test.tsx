import React from 'react';
import SkipAccountSecurityModal from './';

import { render } from '@testing-library/react-native';
const noop = () => ({});

describe('HintModal', () => {
  it('should render correctly', () => {
    const { toJSON } = render(
      <SkipAccountSecurityModal
        onCancel={noop}
        onConfirm={noop}
        onPress={noop}
        toggleSkipCheckbox={noop}
        modalVisible={false}
        skipCheckbox={false}
      />,
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
