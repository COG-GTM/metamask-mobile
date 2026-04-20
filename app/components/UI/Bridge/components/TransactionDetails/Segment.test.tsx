import React from 'react';
import { render } from '@testing-library/react-native';
import { StatusTypes } from '@metamask/bridge-controller';
import Segment from './Segment';

describe('Segment', () => {
  it('matches snapshot with a pending status', () => {
    const { toJSON } = render(<Segment type={StatusTypes.PENDING} />);
    expect(toJSON()).toMatchSnapshot();
  });

  it('renders with null status (no inner segment width)', () => {
    const { toJSON } = render(<Segment type={null} />);
    expect(toJSON()).toBeTruthy();
  });

  it('renders with COMPLETE status', () => {
    const { toJSON } = render(<Segment type={StatusTypes.COMPLETE} />);
    expect(toJSON()).toBeTruthy();
  });

  it('renders with PENDING status', () => {
    const { toJSON } = render(<Segment type={StatusTypes.PENDING} />);
    expect(toJSON()).toBeTruthy();
  });
});
