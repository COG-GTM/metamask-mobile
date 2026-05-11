import React, { PureComponent } from 'react';
import {
  SafeAreaView,
  Text,
  TextInput,
  View,
  StyleSheet,
  type TextStyle,
} from 'react-native';
import { strings } from '../../../../locales/i18n';
import { fontStyles } from '../../../styles/common';
import ActionView from '../../UI/ActionView';
import { getNavigationOptionsTitle } from '../../UI/Navbar';
import { ThemeContext, mockTheme } from '../../../util/theme';

import { AddBookmarkViewSelectorsIDs } from '../../../../e2e/selectors/Browser/AddBookmarkView.selectors';

type ThemeColors = typeof mockTheme.colors;

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    wrapper: {
      backgroundColor: colors.background.default,
      flex: 1,
    },
    rowWrapper: {
      padding: 20,
    },
    textInput: {
      borderWidth: 1,
      borderRadius: 4,
      borderColor: colors.border.default,
      padding: 16,
      ...(fontStyles.normal as TextStyle),
      color: colors.text.default,
    },
    warningText: {
      color: colors.error.default,
      ...(fontStyles.normal as TextStyle),
    },
    inputTitle: {
      ...(fontStyles.normal as TextStyle),
      color: colors.text.default,
    },
  });

interface AddBookmarkRouteParams {
  title?: string;
  url?: string;
  onAddBookmark?: (bookmark: { name: string; url: string }) => void;
}

interface AddBookmarkNavigation {
  setOptions: (options: unknown) => void;
  pop?: () => void;
}

interface AddBookmarkProps {
  /**
   * navigation object required to push new views
   */
  navigation: AddBookmarkNavigation;
  /**
   * Object that represents the current route info like params passed to it
   */
  route: { params: AddBookmarkRouteParams };
}

interface AddBookmarkState {
  title: string;
  url: string;
  warningSymbol?: string;
  warningDecimals?: string;
}

/**
 * Component that provides ability to add a bookmark
 */
export default class AddBookmark extends PureComponent<
  AddBookmarkProps,
  AddBookmarkState
> {
  static contextType = ThemeContext;

  state: AddBookmarkState = {
    title: '',
    url: '',
  };

  updateNavBar = () => {
    const { navigation } = this.props;
    const colors = (this.context as unknown as { colors?: typeof mockTheme.colors; themeAppearance?: 'light' | 'dark' | 'default' })?.colors || mockTheme.colors;

    navigation.setOptions(
      getNavigationOptionsTitle(
        strings('add_favorite.title'),
        navigation,
        false,
        colors,
      ),
    );
  };

  componentDidMount() {
    this.updateNavBar();
    this.loadInitialValues();
  }

  componentDidUpdate = () => {
    this.updateNavBar();
  };

  loadInitialValues() {
    const { route } = this.props;
    this.setState({
      title: route.params?.title ?? '',
      url: route.params?.url ?? '',
    });
  }

  addBookmark = () => {
    const { title, url } = this.state;
    if (title === '' || url === '') return false;
    this.props.route.params.onAddBookmark?.({ name: title, url });
    this.props.navigation.pop?.();
  };

  cancelAddBookmark = () => {
    this.props.navigation.pop?.();
  };

  onTitleChange = (title: string) => {
    this.setState({ title });
  };

  onUrlChange = (url: string) => {
    this.setState({ url });
  };

  urlInput = React.createRef<TextInput>();

  jumpToUrl = () => {
    const { current } = this.urlInput;
    current && current.focus();
  };

  render = () => {
    const colors = (this.context as unknown as { colors?: typeof mockTheme.colors; themeAppearance?: 'light' | 'dark' | 'default' })?.colors || mockTheme.colors;
    const themeAppearance = (this.context as unknown as { colors?: typeof mockTheme.colors; themeAppearance?: 'light' | 'dark' | 'default' })?.themeAppearance || 'light';
    const styles = createStyles(colors);

    return (
      <SafeAreaView
        style={styles.wrapper}
        testID={AddBookmarkViewSelectorsIDs.CONTAINER}
      >
        <ActionView
          cancelTestID={AddBookmarkViewSelectorsIDs.CANCEL_BUTTON}
          confirmTestID={AddBookmarkViewSelectorsIDs.CONFIRM_BUTTON}
          cancelText={strings('add_favorite.cancel_button')}
          confirmText={strings('add_favorite.add_button')}
          onCancelPress={this.cancelAddBookmark}
          onConfirmPress={this.addBookmark}
        >
          <View>
            <View style={styles.rowWrapper}>
              <Text style={styles.inputTitle}>
                {strings('add_favorite.title_label')}
              </Text>
              <TextInput
                style={styles.textInput}
                placeholder={''}
                placeholderTextColor={colors.text.muted}
                value={this.state.title}
                onChangeText={this.onTitleChange}
                testID={AddBookmarkViewSelectorsIDs.BOOKMARK_TITLE}
                onSubmitEditing={this.jumpToUrl}
                returnKeyType={'next'}
                keyboardAppearance={themeAppearance}
              />
              <Text style={styles.warningText}>{this.state.warningSymbol}</Text>
            </View>
            <View style={styles.rowWrapper}>
              <Text style={styles.inputTitle}>
                {strings('add_favorite.url_label')}
              </Text>
              <TextInput
                style={styles.textInput}
                placeholder={''}
                value={this.state.url}
                onChangeText={this.onUrlChange}
                testID={AddBookmarkViewSelectorsIDs.URL_TEXT}
                ref={this.urlInput}
                returnKeyType={'done'}
                placeholderTextColor={colors.text.muted}
                keyboardAppearance={themeAppearance}
              />
              <Text style={styles.warningText}>
                {this.state.warningDecimals}
              </Text>
            </View>
          </View>
        </ActionView>
      </SafeAreaView>
    );
  };
}
