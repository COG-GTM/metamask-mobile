import { renderHook } from '@testing-library/react-hooks';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { getBuildNumber } from 'react-native-device-info';
import useMinimumVersions from './useMinimumVersions';

jest.mock('react-redux', () => ({
  useSelector: jest.fn()
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn()
}));

jest.mock('react-native-device-info', () => ({
  getBuildNumber: jest.fn()
}));

jest.mock('react-native', () => ({
  InteractionManager: {
    runAfterInteractions: jest.fn((callback) => callback())
  }
}));

jest.mock('../../UI/UpdateNeeded/UpdateNeeded', () => ({
  createUpdateNeededNavDetails: jest.fn()
}));

describe('useMinimumVersions', () => {
  const mockNavigation = {
    navigate: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useNavigation.mockReturnValue(mockNavigation);
  });
  it('requires update only if automaticSecurityChecksEnabled', () => {
    useSelector.mockImplementation(() => ({
      security: { automaticSecurityChecksEnabled: false },
      engine: {
        backgroundState: {
          RemoteFeatureFlagController: {
            remoteFeatureFlags: {
              mobileMinimumVersions: {
                appMinimumBuild: 100,
                appleMinimumOS: 100,
                androidMinimumAPIVersion: 100
              }
            }
          }
        }
      }
    }));

    getBuildNumber.mockReturnValue('101');

    renderHook(() => useMinimumVersions());

    expect(mockNavigation.navigate).not.toHaveBeenCalled();
  });

  it('requires update only if currentBuildNumber is lower than appMinimumBuild', () => {
    useSelector.mockImplementation(() => ({
      security: { automaticSecurityChecksEnabled: true },
      engine: {
        backgroundState: {
          RemoteFeatureFlagController: {
            remoteFeatureFlags: {
              mobileMinimumVersions: {
                appMinimumBuild: 100,
                appleMinimumOS: 100,
                androidMinimumAPIVersion: 100
              }
            }
          }
        }
      }
    }));

    getBuildNumber.mockReturnValue('101');

    renderHook(() => useMinimumVersions());

    expect(mockNavigation.navigate).not.toHaveBeenCalled();
  });
});