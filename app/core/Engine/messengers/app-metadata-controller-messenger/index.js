


// Export the types
export * from './types';

/**
 * Get the AppMetadataControllerMessenger for the AppMetadataController.
 *
 * @param baseControllerMessenger - The base controller messenger.
 * @returns The AppMetadataControllerMessenger.
 */
export function getAppMetadataControllerMessenger(
baseControllerMessenger)
{
  return baseControllerMessenger.getRestricted({
    name: 'AppMetadataController',
    allowedEvents: [],
    allowedActions: []
  });
}