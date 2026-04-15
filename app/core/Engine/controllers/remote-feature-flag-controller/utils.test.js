import { Messenger } from '@metamask/base-controller';
import {
  RemoteFeatureFlagController } from

'@metamask/remote-feature-flag-controller';
import { createRemoteFeatureFlagController } from './utils';
import { v4 as uuidv4 } from 'uuid';

const mockUpdateRemoteFeatureFlags = jest.fn().mockResolvedValue(undefined);

jest.mock('@metamask/remote-feature-flag-controller', () => {
  const originalModule = jest.requireActual(
    '@metamask/remote-feature-flag-controller'
  );
  return {
    ...originalModule,
    RemoteFeatureFlagController: jest.fn().mockImplementation((params) => ({
      updateRemoteFeatureFlags: mockUpdateRemoteFeatureFlags, // Ensures it returns a resolved promise
      ...params // Ensure that fetchInterval and other params are stored
    }))
  };
});

describe('RemoteFeatureFlagController utils', () => {
  let messenger;

  beforeEach(() => {
    messenger =
    new Messenger();
    jest.clearAllMocks();
  });

  describe('createRemoteFeatureFlagController', () => {
    it('calls updateRemoteFeatureFlags when enabled', () => {
      createRemoteFeatureFlagController({
        state: undefined,
        messenger,
        disabled: false,
        getMetaMetricsId: () => uuidv4()
      });

      expect(mockUpdateRemoteFeatureFlags).toHaveBeenCalled();
    });

    it('does not call updateRemoteFeatureFlagscontroller when controller is disabled', () => {
      createRemoteFeatureFlagController({
        state: undefined,
        messenger,
        disabled: true,
        getMetaMetricsId: () => uuidv4()
      });

      expect(mockUpdateRemoteFeatureFlags).not.toHaveBeenCalled();
    });

    it('passes fetchInterval to RemoteFeatureFlagController', async () => {
      const fetchInterval = 6000;

      createRemoteFeatureFlagController({
        state: undefined,
        messenger,
        disabled: false,
        getMetaMetricsId: () => uuidv4(),
        fetchInterval
      });

      // Ensure the constructor was called with fetchInterval
      expect(RemoteFeatureFlagController).toHaveBeenCalledWith(
        expect.objectContaining({ fetchInterval })
      );
    });
  });
});