import React, { ComponentType } from 'react';
import useMetrics from './useMetrics';
import { IWithMetricsAwarenessProps } from './withMetricsAwareness.types';

const withMetricsAwareness =
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any


    <P extends IWithMetricsAwarenessProps>(Children: ComponentType<P>) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (props: any) =>
      <Children {...props} metrics={useMetrics()} />;

export default withMetricsAwareness;
