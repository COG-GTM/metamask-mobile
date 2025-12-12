import React, { PureComponent } from 'react';
// @ts-expect-error - react-native-progress does not have type declarations
import ProgressBar from 'react-native-progress/Bar';
import FadeView from '../FadeView';
import { ThemeContext, mockTheme } from '../../../util/theme';

interface WebviewProgressBarProps {
  /**
   * Float that represents the progress complete
   * between 0 and 1
   */
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
    const colors = this.context?.colors || mockTheme.colors;

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
