import React from 'react';
import Logger from '../../../util/Logger';
import trackErrorAsAnalytics from '../../../util/metrics/TrackError/trackErrorAsAnalytics';
























class ComponentErrorBoundary extends React.Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, errorInfo) {
    this.props.onError?.();

    const { componentLabel, dontTrackAsError } = this.props;

    if (dontTrackAsError) {
      trackErrorAsAnalytics(
        `Component Error Boundary: ${componentLabel}`,
        error?.message
      );
      return;
    }
    Logger.error(error, { View: this.props.componentLabel, ...errorInfo });
  }

  getErrorMessage = () =>
  `Component: ${this.props.componentLabel}\n${this.state.error?.toString()}`;

  render() {
    return this.state.error ? null : this.props.children;
  }
}

export default ComponentErrorBoundary;