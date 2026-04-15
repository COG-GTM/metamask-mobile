import { LOG_TAG } from './validateMigration.types';

/**
 * Verifies that the engine is initialized
 */
export const validateEngineInitialized = (state) => {
  const errors = [];
  if (!state?.engine?.backgroundState) {
    errors.push(`${LOG_TAG}: Engine backgroundState not found.`);
  }
  return errors;
};