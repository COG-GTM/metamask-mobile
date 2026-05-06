import React, { PureComponent } from 'react';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error - no type definitions available
import ProgressBar from 'react-native-progress/Bar';
import FadeView from '../FadeView';
import { ThemeContext, mockTheme } from '../../../util/theme';

interface Props {
  /**
   * Float that represents the progress complete
   * between 0 and 1
   */
  progress?: number;
}

interface State {
  visible: boolean;
}

/**
 * PureComponent that wraps the ProgressBar
 * and allows to fade it in / out
 * via the boolean prop visible
 */
export default class WebviewProgressBar extends PureComponent<Props, State> {
  static contextType = ThemeContext;

  declare context: React.ContextType<typeof ThemeContext>;

  mounted = false;

  state: State = {
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
