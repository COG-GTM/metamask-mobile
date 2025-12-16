import React, { PureComponent, RefObject, createRef } from 'react';
import { SafeAreaView, Text, TextInput, View, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { strings } from '../../../../locales/i18n';
import { fontStyles } from '../../../styles/common';
import ActionView from '../../UI/ActionView';
import { getNavigationOptionsTitle } from '../../UI/Navbar';
import { ThemeContext, mockTheme } from '../../../util/theme';
import { Theme } from '../../../util/theme/models';

import { AddBookmarkViewSelectorsIDs } from '../../../../e2e/selectors/Browser/AddBookmarkView.selectors';

interface Styles {
  wrapper: ViewStyle;
  rowWrapper: ViewStyle;
  textInput: TextStyle;
  warningText: TextStyle;
  inputTitle: TextStyle;
}

const createStyles = (colors: Theme['colors']): Styles =>
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
      ...fontStyles.normal,
      color: colors.text.default,
    },
    warningText: {
      color: colors.error.default,
      ...fontStyles.normal,
    },
    inputTitle: {
      ...fontStyles.normal,
      color: colors.text.default,
    },
  });

interface Bookmark {
  name: string;
  url: string;
}

interface NavigationObject {
  setOptions: (options: unknown) => void;
  pop: () => void;
}

interface RouteObject {
  params?: {
    title?: string;
    url?: string;
    onAddBookmark: (bookmark: Bookmark) => void;
  };
}

interface AddBookmarkProps {
  navigation: NavigationObject;
  route: RouteObject;
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
export default class AddBookmark extends PureComponent<AddBookmarkProps, AddBookmarkState> {
  declare context: React.ContextType<typeof ThemeContext>;

  state: AddBookmarkState = {
    title: '',
    url: '',
  };

  urlInput: RefObject<TextInput> = createRef();

  updateNavBar = () => {
    const { navigation } = this.props;
    const colors = this.context?.colors || mockTheme.colors;

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
    this.props.route.params?.onAddBookmark({ name: title, url });
    this.props.navigation.pop();
  };

  cancelAddBookmark = () => {
    this.props.navigation.pop();
  };

  onTitleChange = (title: string) => {
    this.setState({ title });
  };

  onUrlChange = (url: string) => {
    this.setState({ url });
  };

  jumpToUrl = () => {
    const { current } = this.urlInput;
    current && current.focus();
  };

  addToken = () => {
    // Placeholder for addToken functionality
  };

  render = () => {
    const colors = this.context?.colors || mockTheme.colors;
    const themeAppearance = this.context?.themeAppearance || 'light';
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
                onSubmitEditing={this.addToken}
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

AddBookmark.contextType = ThemeContext;
