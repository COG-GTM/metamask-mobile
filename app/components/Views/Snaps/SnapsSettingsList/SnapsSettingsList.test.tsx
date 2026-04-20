import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('../components/SnapElement', () => ({
  SnapElement: ({ id }: { id: string }) => {
    const { Text } = jest.requireActual('react-native');
    return <Text>{`SnapElement:${id}`}</Text>;
  },
}));

jest.mock('../../../UI/Navbar', () => ({
  getNavigationOptionsTitle: jest.fn(() => ({ title: 'Snaps' })),
}));

const mockSetOptions = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ setOptions: mockSetOptions }),
}));

const mockSnaps: Record<string, unknown> = {
  'npm:@metamask/a-snap': { id: 'npm:@metamask/a-snap', version: '1.0.0' },
  'npm:@metamask/b-snap': { id: 'npm:@metamask/b-snap', version: '2.0.0' },
};

jest.mock('../../../../selectors/snaps/snapController', () => ({
  selectSnaps: jest.fn(() => mockSnaps),
}));

jest.mock('react-redux', () => ({
  useSelector: (selector: () => unknown) => selector(),
}));

jest.mock('../../../../component-library/hooks', () => ({
  useStyles: () => ({
    styles: { container: {} },
    theme: { colors: { background: { default: '#fff' } } },
  }),
}));

jest.mock('../../../../util/navigation/navUtils', () => ({
  createNavigationDetails: jest.fn(() => () => ({})),
}));

import SnapsSettingsList, {
  createSnapsSettingsListNavDetails,
} from './SnapsSettingsList';

describe('SnapsSettingsList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders a SnapElement for each snap in the store', () => {
    const { getByText } = render(<SnapsSettingsList />);
    expect(getByText('SnapElement:npm:@metamask/a-snap')).toBeTruthy();
    expect(getByText('SnapElement:npm:@metamask/b-snap')).toBeTruthy();
  });

  it('sets the navigation title on mount', () => {
    render(<SnapsSettingsList />);
    expect(mockSetOptions).toHaveBeenCalled();
  });

  it('exports a navigation details creator', () => {
    expect(typeof createSnapsSettingsListNavDetails).toBe('function');
  });
});
