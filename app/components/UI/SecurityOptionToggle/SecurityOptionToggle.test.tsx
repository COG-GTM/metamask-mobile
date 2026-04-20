import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import SecurityOptionToggle from './SecurityOptionToggle';

jest.mock('../../../util/theme', () => ({
  useTheme: () => ({
    colors: {
      primary: { default: '#037DD6' },
      border: { muted: '#BBC0C5' },
    },
    brandColors: { white: '#FFFFFF' },
  }),
}));

jest.mock('../../../../wdio/utils/generateTestId', () =>
  jest.fn(() => ({})),
);

describe('SecurityOptionToggle', () => {
  const defaultProps = {
    title: 'Privacy Mode',
    value: false,
    onOptionUpdated: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with title', () => {
    const { getByText } = render(
      <SecurityOptionToggle {...defaultProps} />,
    );
    expect(getByText('Privacy Mode')).toBeDefined();
  });

  it('renders with description', () => {
    const { getByText } = render(
      <SecurityOptionToggle
        {...defaultProps}
        description="Enable privacy mode for dApp interactions"
      />,
    );
    expect(getByText('Enable privacy mode for dApp interactions')).toBeDefined();
  });

  it('renders without description', () => {
    const { queryByText } = render(
      <SecurityOptionToggle {...defaultProps} />,
    );
    expect(queryByText('Enable privacy mode')).toBeNull();
  });

  it('matches snapshot', () => {
    const { toJSON } = render(
      <SecurityOptionToggle {...defaultProps} />,
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
