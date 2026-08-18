import React, { ComponentType } from 'react';
import useMetrics from './useMetrics';
import { IWithMetricsAwarenessProps } from './withMetricsAwareness.types';

const withMetricsAwareness =
  <P extends IWithMetricsAwarenessProps>(
    Children: ComponentType<P>,
  ): ComponentType<Omit<P, 'metrics'>> =>
  (props) =>
    <Children {...(props as P)} metrics={useMetrics()} />;

export default withMetricsAwareness;
