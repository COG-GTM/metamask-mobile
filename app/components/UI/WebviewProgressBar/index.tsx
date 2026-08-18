import React, { PureComponent } from 'react';
// @ts-expect-error react-native-progress/Bar does not provide TypeScript declarations.
import ProgressBar from 'react-native-progress/Bar';
import FadeView from '../FadeView';
import { ThemeContext, mockTheme } from '../../../util/theme';
import type { Theme } from '../../../util/theme/models';

interface WebviewProgressBarProps {
  progress?: number;
}

interface WebviewProgressBarState {
  visible: boolean;
}

/**
 * PureComponent that wraps the ProgressBar
 * and allows to fade it in / out
 * via the boolean prop visible
 */
export default class WebviewProgressBar extends PureComponent<
  WebviewProgressBarProps,
  WebviewProgressBarState
> {
  state: WebviewProgressBarState = {
    visible: true,
  };

  mounted = false;

  componentDidMount() {
    this.mounted = true;
  }

  componentWillUnmount() {
    this.mounted = false;
  }

  componentDidUpdate() {
    if (this.props.progress === 1) {
      this.hide();
    } else if (!this.state.visible && this.props.progress !== 1) {
      this.show();
    }
  }

  hide(): void {
    setTimeout(() => {
      this.mounted && this.setState({ visible: false });
    }, 300);
  }

  show(): void {
    this.mounted && this.setState({ visible: true });
  }

  render = () => {
    const colors = (this.context as Theme).colors || mockTheme.colors;

    return (
      <FadeView visible={this.state.visible}>
        <ProgressBar
          progress={this.props.progress}
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
}

WebviewProgressBar.contextType = ThemeContext;
