jest.mock('../../../core/Engine/Engine', () => ({
  controllerMessenger: {
    call: jest.fn(),
  },
  context: {
    SnapInterfaceController: {
      updateInterfaceState: jest.fn(),
    },
  },
}));

import { Box, Text } from '@metamask/snaps-sdk/jsx';
import {
  renderInterface,
  MOCK_SNAP_ID,
  MOCK_INTERFACE_ID,
} from './testUtils';

describe('testUtils', () => {
  it('exports the mock snap and interface ids', () => {
    expect(MOCK_SNAP_ID).toBe('npm:@metamask/test-snap-bip44');
    expect(MOCK_INTERFACE_ID).toBe('interfaceId');
  });

  it('renders the provided JSX content and returns a store and helpers', () => {
    const content = Box({ children: Text({ children: 'Hello world' }) });
    const result = renderInterface(content);
    expect(result.store).toBeDefined();
    expect(typeof result.updateInterface).toBe('function');
    expect(typeof result.getRenderCount).toBe('function');
    expect(result.getByText('Hello world')).toBeTruthy();
  });

  it('updateInterface dispatches a new content snapshot', () => {
    const content = Box({ children: Text({ children: 'First' }) });
    const result = renderInterface(content);

    expect(result.getByText('First')).toBeTruthy();
    result.updateInterface(
      Box({ children: Text({ children: 'Second' }) }),
    );
    expect(result.getByText('Second')).toBeTruthy();
  });
});
