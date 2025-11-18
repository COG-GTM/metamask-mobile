import React, { PureComponent } from 'react';
// @ts-ignore - no type definitions available
import ProgressBar from 'react-native-progress/Bar';
import FadeView from '../FadeView';
import { ThemeContext, mockTheme } from '../../../util/theme';
import { Theme } from '../../../util/theme/models';

interface WebviewProgressBarProps {
  progress?: number;
}

interface WebviewProgressBarState {
  visible: boolean;
}

export default class WebviewProgressBar extends PureComponent<WebviewProgressBarProps, WebviewProgressBarState> {
  static contextType = ThemeContext;
  declare context: React.ContextType<typeof ThemeContext>;
  private mounted = false;

  state: WebviewProgressBarState = {
    visible: true,
  };

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

  hide() {
    setTimeout(() => {
      this.mounted && this.setState({ visible: false });
    }, 300);
  }

  show() {
    this.mounted && this.setState({ visible: true });
  }

  render = () => {
    const colors = (this.context as Theme)?.colors || mockTheme.colors;

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
