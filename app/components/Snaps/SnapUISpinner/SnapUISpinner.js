import React from 'react';
import { ActivityIndicator } from 'react-native';
import { useTheme } from '../../../util/theme';

export const SnapUISpinner = () => {
  const theme = useTheme();

  return (
    <ActivityIndicator
      size="large"
      color={theme.colors.primary.default}
      /* eslint-disable-next-line react-native/no-inline-styles */
      style={{ alignItems: 'flex-start' }} />);


};