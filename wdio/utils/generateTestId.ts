import type { Platform } from 'react-native';

export default <T extends string | undefined>(
  _platform: typeof Platform,
  id: T,
) => ({ testID: id });
