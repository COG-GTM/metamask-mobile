/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, @typescript-eslint/no-shadow, @typescript-eslint/prefer-optional-chain, @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires, @typescript-eslint/prefer-for-of, import/no-namespace, import/no-named-as-default-member, react/no-unstable-nested-components */
import React, { PureComponent } from 'react';
import { SafeAreaView, Text, TextInput, View, StyleSheet } from 'react-native';
import { strings } from '../../../../locales/i18n';
import { fontStyles } from '../../../styles/common';
import ActionView from '../../UI/ActionView';
import { getNavigationOptionsTitle } from '../../UI/Navbar';
import { ThemeContext, mockTheme } from '../../../util/theme';

import { AddBookmarkViewSelectorsIDs } from '../../../../e2e/selectors/Browser/AddBookmarkView.selectors';

// @ts-expect-error -- legacy JavaScript UI type boundary
const createStyles = (colors) =>
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

/**
 * Copmonent that provides ability to add a bookmark
 */
export default class AddBookmark extends PureComponent {
  state = {
    title: '',
    url: '',
  };

  updateNavBar = () => {
    // @ts-expect-error -- legacy JavaScript UI type boundary
    const { navigation } = this.props;
    // @ts-expect-error -- legacy JavaScript UI type boundary
    const colors = this.context.colors || mockTheme.colors;

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
    // @ts-expect-error -- legacy JavaScript UI type boundary
    const { route } = this.props;
    this.setState({
      title: route.params?.title ?? '',
      url: route.params?.url ?? '',
    });
  }

  addBookmark = () => {
    const { title, url } = this.state;
    if (title === '' || url === '') return false;
    // @ts-expect-error -- legacy JavaScript UI type boundary
    this.props.route.params.onAddBookmark({ name: title, url });
    // @ts-expect-error -- legacy JavaScript UI type boundary
    this.props.navigation.pop();
  };

  cancelAddBookmark = () => {
    // @ts-expect-error -- legacy JavaScript UI type boundary
    this.props.navigation.pop();
  };

  // @ts-expect-error -- legacy JavaScript UI type boundary
  onTitleChange = (title) => {
    this.setState({ title });
  };

  // @ts-expect-error -- legacy JavaScript UI type boundary
  onUrlChange = (url) => {
    this.setState({ url });
  };

  urlInput = React.createRef();

  jumpToUrl = () => {
    const { current } = this.urlInput;
    // @ts-expect-error -- legacy JavaScript UI type boundary
    current && current.focus();
  };

  render = () => {
    // @ts-expect-error -- legacy JavaScript UI type boundary
    const colors = this.context.colors || mockTheme.colors;
    // @ts-expect-error -- legacy JavaScript UI type boundary
    const themeAppearance = this.context.themeAppearance || 'light';
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
              {/* @ts-expect-error -- legacy JavaScript UI type boundary */}
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
                // @ts-expect-error -- legacy JavaScript UI type boundary
                ref={this.urlInput}
                // @ts-expect-error -- legacy JavaScript UI type boundary
                onSubmitEditing={this.addToken}
                returnKeyType={'done'}
                placeholderTextColor={colors.text.muted}
                keyboardAppearance={themeAppearance}
              />
              <Text style={styles.warningText}>
                {/* @ts-expect-error -- legacy JavaScript UI type boundary */}
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

interface AddBookmarkProps {
  navigation?: Record<string, any>;
  route?: Record<string, any>;
}
type Props = AddBookmarkProps;
