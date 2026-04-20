import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, waitFor } from '@testing-library/react-native';
import renderWithProvider from '../../../../../util/test/renderWithProvider';
import { backgroundState } from '../../../../../util/test/initial-root-state';
import DeleteMetaMetricsData from './DeleteMetaMetricsData';
import useDataDeletion from './useDataDeletion';
import { useMetrics } from '../../../../hooks/useMetrics';
import { DataDeleteResponseStatus } from '../../../../../core/Analytics';

jest.mock('@metamask/react-native-button', () => 'MetaMaskButton');

jest.mock('../../../../UI/SettingsButtonSection', () => {
  const ReactLib = jest.requireActual('react');
  const { View, TouchableOpacity, Text } = jest.requireActual('react-native');
  return ({
    testID,
    sectionTitle,
    sectionButtonText,
    descriptionText,
    buttonDisabled,
    modalOnConfirm,
  }: {
    testID?: string;
    sectionTitle: string;
    sectionButtonText: string;
    descriptionText: React.ReactNode;
    buttonDisabled?: boolean;
    modalOnConfirm?: () => void;
  }) =>
    ReactLib.createElement(
      View,
      { testID: `${testID}-section` },
      ReactLib.createElement(Text, null, sectionTitle),
      ReactLib.createElement(View, null, descriptionText),
      ReactLib.createElement(
        TouchableOpacity,
        {
          testID,
          disabled: buttonDisabled,
          onPress: modalOnConfirm,
        },
        ReactLib.createElement(Text, null, sectionButtonText),
      ),
    );
});

jest.mock('../../../../hooks/useMetrics', () => ({
  useMetrics: jest.fn(),
  MetaMetricsEvents: {
    ANALYTICS_REQUEST_DATA_DELETION: 'ANALYTICS_REQUEST_DATA_DELETION',
  },
}));

jest.mock('./useDataDeletion');

jest.mock('react-native-device-info', () => ({
  getBrand: jest.fn(() => 'Apple'),
  getDeviceId: jest.fn(() => 'iPhone14,2'),
}));

const initialState = { engine: { backgroundState } };

describe('DeleteMetaMetricsData', () => {
  const mockTrackEvent = jest.fn();
  const mockCheckDataDeleteStatus = jest.fn();
  const mockCreateDataDeletionTask = jest.fn();
  const mockCreateEventBuilder = jest.fn(() => ({
    addProperties: jest.fn().mockReturnThis(),
    build: jest.fn().mockReturnValue({}),
  }));
  const mockIsDataDeletionAvailable = jest.fn();
  const mockSetDataDeletionTaskStatus = jest.fn();
  const mockSetDeletionTaskDate = jest.fn();
  const mockSetDataTrackedSinceLastDeletion = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockCheckDataDeleteStatus.mockResolvedValue({
      deletionRequestDate: undefined,
      dataDeletionRequestStatus: undefined,
      hasCollectedDataSinceDeletionRequest: false,
    });
    mockCreateDataDeletionTask.mockResolvedValue({
      status: DataDeleteResponseStatus.ok,
    });
    mockIsDataDeletionAvailable.mockReturnValue(true);

    (useMetrics as jest.Mock).mockReturnValue({
      trackEvent: mockTrackEvent,
      checkDataDeleteStatus: mockCheckDataDeleteStatus,
      createDataDeletionTask: mockCreateDataDeletionTask,
      createEventBuilder: mockCreateEventBuilder,
    });

    (useDataDeletion as jest.Mock).mockReturnValue({
      isDataDeletionAvailable: mockIsDataDeletionAvailable,
      deletionTaskDate: undefined,
      setDataDeletionTaskStatus: mockSetDataDeletionTaskStatus,
      setDeletionTaskDate: mockSetDeletionTaskDate,
      setDataTrackedSinceLastDeletion: mockSetDataTrackedSinceLastDeletion,
    });
  });

  it('renders correctly when data deletion is available', async () => {
    const { toJSON } = renderWithProvider(
      <DeleteMetaMetricsData metricsOptin />,
      { state: initialState },
    );
    await waitFor(() => expect(mockCheckDataDeleteStatus).toHaveBeenCalled());
    expect(toJSON()).toMatchSnapshot();
  });

  it('checks initial deletion status on mount', async () => {
    renderWithProvider(<DeleteMetaMetricsData metricsOptin />, {
      state: initialState,
    });

    await waitFor(() => expect(mockCheckDataDeleteStatus).toHaveBeenCalled());
    expect(mockSetDataTrackedSinceLastDeletion).toHaveBeenCalledWith(true);
  });

  it('creates a deletion task and tracks an event when confirmed', async () => {
    const { getByTestId } = renderWithProvider(
      <DeleteMetaMetricsData metricsOptin />,
      { state: initialState },
    );

    await waitFor(() => expect(mockCheckDataDeleteStatus).toHaveBeenCalled());

    fireEvent.press(getByTestId('delete-metrics-button'));

    await waitFor(() => {
      expect(mockCreateDataDeletionTask).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(mockTrackEvent).toHaveBeenCalled();
    });
  });

  it('shows an alert when deletion request fails', async () => {
    mockCreateDataDeletionTask.mockResolvedValueOnce({
      status: 'ERROR',
    });
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation();

    const { getByTestId } = renderWithProvider(
      <DeleteMetaMetricsData metricsOptin />,
      { state: initialState },
    );
    await waitFor(() => expect(mockCheckDataDeleteStatus).toHaveBeenCalled());

    fireEvent.press(getByTestId('delete-metrics-button'));

    await waitFor(() => expect(alertSpy).toHaveBeenCalled());
    expect(mockTrackEvent).not.toHaveBeenCalled();

    alertSpy.mockRestore();
  });

  it('renders the post-deletion description when data deletion is not available', async () => {
    mockIsDataDeletionAvailable.mockReturnValue(false);
    const { toJSON } = renderWithProvider(
      <DeleteMetaMetricsData metricsOptin={false} />,
      { state: initialState },
    );
    await waitFor(() => expect(mockCheckDataDeleteStatus).toHaveBeenCalled());
    expect(toJSON()).toBeTruthy();
  });
});
