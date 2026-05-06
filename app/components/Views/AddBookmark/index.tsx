import React, { PureComponent } from 'react';
import { SafeAreaView, Text, TextInput, View, StyleSheet } from 'react-native';
import type { ParamListBase, RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { strings } from '../../../../locales/i18n';
import { fontStyles } from '../../../styles/common';
import ActionView from '../../UI/ActionView';
import { getNavigationOptionsTitle } from '../../UI/Navbar';
import { ThemeContext, mockTheme } from '../../../util/theme';

import { AddBookmarkViewSelectorsIDs } from '../../../../e2e/selectors/Browser/AddBookmarkView.selectors';
import type { Colors } from '../../../util/theme/models';

const createStyles = (colors: Colors) =>
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

interface AddBookmarkRouteParams {
  title?: string;
  url?: string;
  onAddBookmark: (bookmark: { name: string; url: string }) => void;
}

interface AddBookmarkProps {
  navigation: StackNavigationProp<ParamListBase>;
  route: RouteProp<{ params: AddBookmarkRouteParams }, 'params'>;
}

interface AddBookmarkState {
  title: string;
  url: string;
}

/**
 * Component that provides ability to add a bookmark
 */
export default class AddBookmark extends PureComponent<AddBookmarkProps, AddBookmarkState> {
  static contextType = ThemeContext;

  declare context: React.ContextType<typeof ThemeContext>;

  state: AddBookmarkState = {
    title: '',
    url: '',
  };

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
    this.props.route.params.onAddBookmark({ name: title, url });
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

  urlInput = React.createRef<TextInput>();

  jumpToUrl = () => {
    const { current } = this.urlInput;
    current && current.focus();
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
                onSubmitEditing={this.addBookmark}
                returnKeyType={'done'}
                placeholderTextColor={colors.text.muted}
                keyboardAppearance={themeAppearance}
              />
            </View>
          </View>
        </ActionView>
      </SafeAreaView>
    );
  };
}
