import React, { useEffect, useState } from 'react';
import ProgressBar from 'react-native-progress/Bar';
import FadeView from '../FadeView';
import { useTheme } from '../../../util/theme';

interface WebviewProgressBarProps {
  /**
   * Float that represents the progress complete
   * between 0 and 1
   */
  progress?: number;
}

/**
 * Component that wraps the ProgressBar
 * and allows to fade it in / out
 * via the boolean prop visible
 */
const WebviewProgressBar = ({ progress }: WebviewProgressBarProps) => {
  const [visible, setVisible] = useState(true);
  const { colors } = useTheme();

  useEffect(() => {
    if (progress === 1) {
      const timeout = setTimeout(() => setVisible(false), 300);
      return () => clearTimeout(timeout);
    }
    if (!visible) {
      setVisible(true);
    }
  }, [progress, visible]);

  return (
    <FadeView visible={visible}>
      <ProgressBar
        progress={progress}
        color={colors.primary.default}
        width={null}
        height={3}
        borderRadius={0}
        borderWidth={0}
        useNativeDriver
      />
    </FadeView>
  );
};

export default WebviewProgressBar;
