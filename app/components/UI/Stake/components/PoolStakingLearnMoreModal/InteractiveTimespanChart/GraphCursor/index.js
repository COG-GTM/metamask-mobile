import React from 'react';
import { G, Circle, Line } from 'react-native-svg';
import { useTheme } from '../../../../../../../util/theme';












const GraphCursor = ({ data, currentX, x, y, color }) => {
  const { colors } = useTheme();

  const defaultColor = colors.success.default;

  if (currentX && currentX < 0 || !data) return null;

  const selectedDailyApr = data[currentX];

  return (
    <G x={x?.(currentX)} key="tooltip">
      <G>
        <Line
          y1={1}
          y2={'100%'}
          stroke={color ?? defaultColor}
          strokeWidth={1} />
        
        <Circle
          cy={y?.(selectedDailyApr)}
          r={5}
          stroke={color ?? defaultColor}
          strokeWidth={1}
          fill={color ?? defaultColor} />
        
      </G>
    </G>);

};

export default GraphCursor;