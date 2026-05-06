import React, { PureComponent } from 'react';
import { View } from 'react-native';
import { WebView } from '@metamask/react-native-webview';
import { getWebviewNavbar } from '../../UI/Navbar';
import Share from 'react-native-share'; // eslint-disable-line  import/default
import Logger from '../../../util/Logger';
import { baseStyles } from '../../../styles/common';
import { ThemeContext, mockTheme } from '../../../util/theme';

interface Navigation {
  setOptions: (options: object) => void;
  setParams: (params: object) => void;
}

interface RouteParams {
  url?: string;
  title?: string;
}

interface Route {
  params?: RouteParams;
}

interface Props {
  /**
   * react-navigation object used to switch between screens
   */
  navigation?: Navigation;
  /**
   * Object that represents the current route info like params passed to it
   */
  route?: Route;
}

export default class SimpleWebview extends PureComponent<Props> {
  static contextType = ThemeContext;

  declare context: React.ContextType<typeof ThemeContext>;

  updateNavBar = () => {
    const { navigation, route } = this.props;
    if (!navigation) {
      return;
    }
    const colors = this.context?.colors || mockTheme.colors;
    navigation.setOptions(getWebviewNavbar(navigation, route, colors));
  };

  componentDidMount = () => {
    const { navigation } = this.props;
    this.updateNavBar();
    navigation && navigation.setParams({ dispatch: this.share });
  };

  componentDidUpdate = () => {
    this.updateNavBar();
  };

  share = () => {
    const { route } = this.props;
    const url = route?.params?.url;
    if (url) {
      Share.open({
        url,
      }).catch((err: Error) => {
        Logger.log('Error while trying to share simple web view', err);
      });
    }
  };

  render() {
    const uri = this.props.route?.params?.url;
    if (uri) {
      return (
        <View style={baseStyles.flexGrow}>
          <WebView source={{ uri }} />
        </View>
      );
    }
    return null;
  }
}

export { default as createWebviewNavDetails } from './SimpleWebview.types';
