import { Messenger } from '@metamask/base-controller';
import {
  ClientConfigApiService,
  ClientType,
  DistributionType,
  EnvironmentType,
  RemoteFeatureFlagController,
  RemoteFeatureFlagControllerMessenger,
} from '@metamask/remote-feature-flag-controller';
import {
  createRemoteFeatureFlagController,
  getFeatureFlagAppDistribution,
  getFeatureFlagAppEnvironment,
  isRemoteFeatureFlagOverrideActivated,
} from './utils';
import { v4 as uuidv4 } from 'uuid';
import Logger from '../../../../util/Logger';

const mockUpdateRemoteFeatureFlags = jest.fn().mockResolvedValue(undefined);

jest.mock('@metamask/remote-feature-flag-controller', () => {
  const originalModule = jest.requireActual(
    '@metamask/remote-feature-flag-controller',
  );
  return {
    ...originalModule,
    RemoteFeatureFlagController: jest.fn().mockImplementation((params) => ({
      updateRemoteFeatureFlags: mockUpdateRemoteFeatureFlags, // Ensures it returns a resolved promise
      ...params, // Ensure that fetchInterval and other params are stored
    })),
    ClientConfigApiService: jest.fn(),
  };
});

jest.mock('../../../../util/Logger', () => ({
  __esModule: true,
  default: {
    log: jest.fn(),
    error: jest.fn(),
  },
}));

describe('RemoteFeatureFlagController utils', () => {
  let messenger: RemoteFeatureFlagControllerMessenger;

  beforeEach(() => {
    messenger =
      new Messenger() as unknown as RemoteFeatureFlagControllerMessenger;
    jest.clearAllMocks();
    mockUpdateRemoteFeatureFlags.mockResolvedValue(undefined);
  });

  const getClientConfig = () => {
    const mockedService = ClientConfigApiService as unknown as jest.Mock;
    expect(mockedService).toHaveBeenCalledTimes(1);
    return mockedService.mock.calls[0][0].config;
  };

  describe('getFeatureFlagAppEnvironment', () => {
    it.each([
      ['local', EnvironmentType.Development],
      ['pre-release', EnvironmentType.ReleaseCandidate],
      ['production', EnvironmentType.Production],
      ['unknown-env', EnvironmentType.Development],
      ['', EnvironmentType.Development],
      [undefined, EnvironmentType.Development],
    ])(
      'maps METAMASK_ENVIRONMENT=%p to %p',
      (metamaskEnvironment, expectedEnvironment) => {
        expect(getFeatureFlagAppEnvironment(metamaskEnvironment)).toBe(
          expectedEnvironment,
        );
      },
    );
  });

  describe('getFeatureFlagAppDistribution', () => {
    it.each([
      ['main', DistributionType.Main],
      ['flask', DistributionType.Flask],
      ['beta', DistributionType.Beta],
      ['unknown-build', DistributionType.Main],
      ['', DistributionType.Main],
      [undefined, DistributionType.Main],
    ])(
      'maps METAMASK_BUILD_TYPE=%p to %p',
      (metamaskBuildType, expectedDistribution) => {
        expect(getFeatureFlagAppDistribution(metamaskBuildType)).toBe(
          expectedDistribution,
        );
      },
    );
  });

  describe('isRemoteFeatureFlagOverrideActivated', () => {
    it('is true only when OVERRIDE_REMOTE_FEATURE_FLAGS is exactly "true"', () => {
      expect(isRemoteFeatureFlagOverrideActivated).toBe(
        process.env.OVERRIDE_REMOTE_FEATURE_FLAGS === 'true',
      );
    });
  });

  describe('createRemoteFeatureFlagController', () => {
    it('calls updateRemoteFeatureFlags when enabled', () => {
      createRemoteFeatureFlagController({
        state: undefined,
        messenger,
        disabled: false,
        getMetaMetricsId: () => uuidv4(),
        overrideActivated: false,
      });

      expect(mockUpdateRemoteFeatureFlags).toHaveBeenCalled();
    });

    it('does not call updateRemoteFeatureFlagscontroller when controller is disabled', () => {
      createRemoteFeatureFlagController({
        state: undefined,
        messenger,
        disabled: true,
        getMetaMetricsId: () => uuidv4(),
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
        fetchInterval,
      });

      // Ensure the constructor was called with fetchInterval
      expect(RemoteFeatureFlagController).toHaveBeenCalledWith(
        expect.objectContaining({ fetchInterval }),
      );
    });

    it('passes a mobile ClientConfigApiService configured from the build environment and build type', () => {
      createRemoteFeatureFlagController({
        state: undefined,
        messenger,
        disabled: false,
        getMetaMetricsId: () => uuidv4(),
      });

      const serviceInstance = (ClientConfigApiService as unknown as jest.Mock)
        .mock.instances[0];
      expect(RemoteFeatureFlagController).toHaveBeenCalledWith(
        expect.objectContaining({ clientConfigApiService: serviceInstance }),
      );
      expect(getClientConfig()).toEqual({
        client: ClientType.Mobile,
        environment: getFeatureFlagAppEnvironment(
          process.env.METAMASK_ENVIRONMENT,
        ),
        distribution: getFeatureFlagAppDistribution(
          process.env.METAMASK_BUILD_TYPE,
        ),
      });
    });

    it('logs success after updateRemoteFeatureFlags resolves', async () => {
      createRemoteFeatureFlagController({
        state: undefined,
        messenger,
        disabled: false,
        getMetaMetricsId: () => uuidv4(),
        overrideActivated: false,
      });

      await new Promise(process.nextTick);

      expect(mockUpdateRemoteFeatureFlags).toHaveBeenCalledTimes(1);
      expect(Logger.log).toHaveBeenCalledWith('Feature flags updated');
      expect(Logger.error).not.toHaveBeenCalled();
    });

    it('logs an error instead of leaving the rejection unhandled when updateRemoteFeatureFlags fails', async () => {
      const error = new Error('network down');
      mockUpdateRemoteFeatureFlags.mockRejectedValueOnce(error);

      createRemoteFeatureFlagController({
        state: undefined,
        messenger,
        disabled: false,
        getMetaMetricsId: () => uuidv4(),
        overrideActivated: false,
      });

      await new Promise(process.nextTick);

      expect(Logger.error).toHaveBeenCalledWith(
        error,
        'Failed to update remote feature flags',
      );
      expect(Logger.log).not.toHaveBeenCalledWith('Feature flags updated');
    });

    it('does not fetch remote flags when override is activated', () => {
      createRemoteFeatureFlagController({
        state: undefined,
        messenger,
        disabled: false,
        getMetaMetricsId: () => uuidv4(),
        overrideActivated: true,
      });

      expect(mockUpdateRemoteFeatureFlags).not.toHaveBeenCalled();
      expect(Logger.log).toHaveBeenCalledWith(
        'Remote feature flags override activated',
      );
    });

    it('gives precedence to disabled over override', () => {
      createRemoteFeatureFlagController({
        state: undefined,
        messenger,
        disabled: true,
        getMetaMetricsId: () => uuidv4(),
        overrideActivated: true,
      });

      expect(mockUpdateRemoteFeatureFlags).not.toHaveBeenCalled();
      expect(Logger.log).toHaveBeenCalledWith(
        'Feature flag controller disabled',
      );
    });
  });
});
