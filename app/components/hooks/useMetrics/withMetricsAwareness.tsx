import React, { ComponentType } from 'react';
import useMetrics from './useMetrics';
import { IWithMetricsAwarenessProps } from './withMetricsAwareness.types';

const withMetricsAwareness =
  <P extends IWithMetricsAwarenessProps>(Children: ComponentType<P>) =>
  (props: Omit<P, 'metrics'>) =>
    <Children {...(props as P)} metrics={useMetrics()} />;

export default withMetricsAwareness;
