import React from 'react';
import { render } from '@testing-library/react-native';
import NavigationProvider from './NavigationProvider';
import { useDispatch } from 'react-redux';
import { View, Text } from 'react-native';
import { onNavigationReady } from '../../../actions/navigation';
import NavigationService from '../../../core/NavigationService';

import { endTrace, trace, TraceName } from '../../../util/trace';

jest.mock('../../../util/trace', () => {
  const actual = jest.requireActual('../../../util/trace');
  return {
    ...actual,
    trace: jest.fn(),
    endTrace: jest.fn()
  };
});

// Mock UIStartup to prevent second trace from being called (for testing purposes)
jest.mock('../../../core/Performance/UIStartup', () => jest.fn());

jest.mock('../../../core/NavigationService', () => ({
  navigation: jest.fn()
}));

jest.mock('react-redux', () => ({
  useDispatch: jest.fn()
}));

jest.mock('../../../util/theme', () => ({
  useTheme: jest.fn().mockReturnValue({
    colors: {
      background: {
        default: '#FFFFFF'
      }
    }
  })
}));

describe('NavigationProvider', () => {
  const mockDispatch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    NavigationService.navigation =
    undefined;
    useDispatch.mockReturnValue(mockDispatch);
  });

  it('renders children correctly', () => {
    const testMessage = 'Test Child Component';
    const { getByText } = render(
      <NavigationProvider>
        <Text>{testMessage}</Text>
      </NavigationProvider>
    );

    expect(getByText(testMessage)).toBeTruthy();
  });

  it('dispatches navigation ready action when ready', async () => {
    render(
      <NavigationProvider>
        <View />
      </NavigationProvider>
    );

    expect(mockDispatch).toHaveBeenCalledWith(onNavigationReady());
  });

  it('sets navigation reference correctly', () => {
    expect(NavigationService.navigation).not.toBeDefined();

    render(
      <NavigationProvider>
        <View />
      </NavigationProvider>
    );

    expect(NavigationService.navigation).toBeDefined();
    expect(NavigationService.navigation).toHaveProperty('navigate');
  });

  it('Measures performance trace order when navigation provider is initialized', () => {
    // Track calls in array to test for correct order
    const traceCalls = [];
    const mockTraceCall =
    (functionName) =>
    ({ name }) => {
      traceCalls.push({ functionName, name });
    };
    trace.mockImplementation(mockTraceCall('trace'));
    endTrace.mockImplementation(mockTraceCall('endTrace'));

    render(
      <NavigationProvider>
        <View />
      </NavigationProvider>
    );

    expect(traceCalls).toEqual([
    { functionName: 'trace', name: TraceName.NavInit },
    { functionName: 'endTrace', name: TraceName.NavInit }]
    );
  });
});