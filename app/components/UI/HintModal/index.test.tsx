import React from 'react';
import HintModal from './';

import { render } from '@testing-library/react-native';
const noop = () => ({});
const hint = 'hint';

describe('HintModal', () => {
  it('should render correctly', () => {
    const { toJSON } = render(
      <HintModal
        onCancel={noop}
        onConfirm={noop}
        onChangeText={noop}
        onRequestClose={noop}
        modalVisible={false}
        value={hint}
      />,
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
