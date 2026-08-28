import React, { useEffect, useRef, useState } from 'react';
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
  const mounted = useRef(false);
  const firstRender = useRef(true);
  const { colors } = useTheme();

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (progress === 1) {
      setTimeout(() => {
        if (mounted.current) {
          setVisible(false);
        }
      }, 300);
    } else if (!visible && progress !== 1) {
      if (mounted.current) {
        setVisible(true);
      }
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
