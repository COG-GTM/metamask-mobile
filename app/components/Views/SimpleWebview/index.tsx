import React, { PureComponent } from 'react';
import { View } from 'react-native';
import { WebView } from '@metamask/react-native-webview';
import { getWebviewNavbar } from '../../UI/Navbar';
import Share from 'react-native-share';
import Logger from '../../../util/Logger';
import { baseStyles } from '../../../styles/common';
import { ThemeContext, mockTheme } from '../../../util/theme';

interface NavigationObject {
  setOptions: (options: Record<string, unknown>) => void;
  setParams: (params: Record<string, unknown>) => void;
}

interface RouteObject {
  params?: {
    url?: string;
  };
}

interface SimpleWebviewProps {
  navigation?: NavigationObject;
  route?: RouteObject;
}

export default class SimpleWebview extends PureComponent<SimpleWebviewProps> {
  declare context: React.ContextType<typeof ThemeContext>;

  updateNavBar = () => {
    const { navigation, route } = this.props;
    const colors = this.context.colors || mockTheme.colors;
    if (navigation && route) {
      navigation.setOptions(getWebviewNavbar(navigation, route, colors));
    }
  };

  componentDidMount = () => {
    const { navigation } = this.props;
    this.updateNavBar();
    navigation?.setParams({ dispatch: this.share });
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

SimpleWebview.contextType = ThemeContext;
