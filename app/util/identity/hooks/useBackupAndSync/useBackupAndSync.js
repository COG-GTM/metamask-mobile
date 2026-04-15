import { useState, useCallback } from 'react';
import { setIsBackupAndSyncFeatureEnabled as setIsBackupAndSyncFeatureEnabledAction } from '../../../../actions/identity';


/**
 * Custom hook to set the enablement status of a backup and sync feature.
 *
 * @returns An object containing the `setIsBackupAndSyncFeatureEnabled` function, loading state, and error state.
 */
export function useBackupAndSync()





{
  const [error, setError] = useState(null);

  const setIsBackupAndSyncFeatureEnabled = useCallback(
    async (feature, enabled) => {
      setError(null);

      try {
        await setIsBackupAndSyncFeatureEnabledAction(feature, enabled);
      } catch (e) {
        const errorMessage =
        e instanceof Error ? e.message : JSON.stringify(e ?? '');
        setError(errorMessage);
      }
    },
    []
  );

  return { setIsBackupAndSyncFeatureEnabled, error };
}