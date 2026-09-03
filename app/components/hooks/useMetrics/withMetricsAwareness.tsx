import React, { ComponentType } from 'react';
import useMetrics from './useMetrics';
import { IWithMetricsAwarenessProps } from './withMetricsAwareness.types';

const withMetricsAwareness =
  <P extends IWithMetricsAwarenessProps>(
    Children: ComponentType<P>,
  ): ComponentType<Omit<P, 'metrics'>> =>
  (props: Omit<P, 'metrics'>) =>
    React.createElement(
      Children,
      { ...props, metrics: useMetrics() } as unknown as P,
    );

export default withMetricsAwareness;
