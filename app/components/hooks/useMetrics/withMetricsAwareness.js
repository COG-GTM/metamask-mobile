import React from 'react';
import useMetrics from './useMetrics';


const withMetricsAwareness =
// TODO: Replace "any" with type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(Children) => (props) =>
<Children {...props} metrics={useMetrics()} />;

export default withMetricsAwareness;