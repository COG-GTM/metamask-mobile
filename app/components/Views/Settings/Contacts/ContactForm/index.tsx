/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, @typescript-eslint/no-shadow, @typescript-eslint/prefer-optional-chain, @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires, @typescript-eslint/prefer-for-of, import/no-namespace, import/no-named-as-default-member, react/no-unstable-nested-components */
import React, { PureComponent } from 'react';
import {
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { fontStyles } from '../../../../../styles/common';
import { getEditableOptions } from '../../../../UI/Navbar';
import StyledButton from '../../../../UI/StyledButton';
import Engine from '../../../../../core/Engine';
import { toChecksumAddress } from 'ethereumjs-util';
import { connect } from 'react-redux';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { strings } from '../../../../../../locales/i18n';
import {
  renderShortAddress,
  validateAddressOrENS,
} from '../../../../../util/address';
import ErrorMessage from '../../../confirmations/legacy/SendFlow/ErrorMessage';
import AntIcon from 'react-native-vector-icons/AntDesign';
import ActionSheet from '@metamask/react-native-actionsheet';
import { mockTheme, ThemeContext } from '../../../../../util/theme';
import {
  CONTACT_ALREADY_SAVED,
  SYMBOL_ERROR,
} from '../../../../../constants/error';
import Routes from '../../../../../constants/navigation/Routes';
import { createQRScannerNavDetails } from '../../../QRTabSwitcher';
import { selectEvmChainId } from '../../../../../selectors/networkController';
import { AddContactViewSelectorsIDs } from '../../../../../../e2e/selectors/Settings/Contacts/AddContactView.selectors';
import { selectInternalAccounts } from '../../../../../selectors/accountsController';
import { toLowerCaseEquals } from '../../../../../util/general';
import { selectAddressBook } from '../../../../../selectors/addressBookController';

// @ts-expect-error -- legacy JavaScript UI type boundary
const createStyles = (colors) =>
  StyleSheet.create({
    wrapper: {
      backgroundColor: colors.background.default,
      flex: 1,
      flexDirection: 'column',
    },
    scrollWrapper: {
      flex: 1,
      paddingVertical: 12,
    },
    input: {
      ...fontStyles.normal,
      flex: 1,
      fontSize: 12,
      borderColor: colors.border.default,
      borderRadius: 5,
      borderWidth: 2,
      padding: 10,
      flexDirection: 'row',
      alignItems: 'center',
      color: colors.text.default,
    },
    resolvedInput: {
      ...fontStyles.normal,
      fontSize: 10,
      color: colors.text.default,
    },
    informationWrapper: {
      flex: 1,
      paddingHorizontal: 24,
    },
    label: {
      fontSize: 14,
      paddingVertical: 12,
      color: colors.text.default,
      ...fontStyles.bold,
    },
    buttonsWrapper: {
      marginVertical: 12,
      flexDirection: 'row',
      alignSelf: 'flex-end',
    },
    buttonsContainer: {
      flex: 1,
      flexDirection: 'column',
      alignSelf: 'flex-end',
    },
    scanIcon: {
      flexDirection: 'column',
      alignItems: 'center',
    },
    iconWrapper: {
      alignItems: 'flex-end',
    },
    textInput: {
      ...fontStyles.normal,
      padding: 0,
      paddingRight: 8,
      color: colors.text.default,
    },
    inputWrapper: {
      flex: 1,
      flexDirection: 'column',
    },
    textInputDisaled: {
      borderColor: colors.transparent,
    },
    actionButton: {
      marginVertical: 4,
    },
  });

const ADD = 'add';
const EDIT = 'edit';

/**
 * View that contains app information
 */
class ContactForm extends PureComponent {

  state = {
    name: null,
    address: null,
    addressError: null,
    toEnsName: null,
    toEnsAddress: null,
    addressReady: false,
    // @ts-expect-error -- legacy JavaScript UI type boundary
    mode: this.props.route.params?.mode ?? ADD,
    memo: null,
    editable: true,
    inputWidth: Platform.OS === 'android' ? '99%' : undefined,
  };

  actionSheet = React.createRef();
  addressInput = React.createRef();
  memoInput = React.createRef();

  updateNavBar = () => {
    // @ts-expect-error -- legacy JavaScript UI type boundary
    const { navigation, route } = this.props;
    // @ts-expect-error -- legacy JavaScript UI type boundary
    const colors = this.context.colors || mockTheme.colors;
    navigation.setOptions(
      getEditableOptions(
        strings(`address_book.${route.params?.mode ?? ADD}_contact_title`),
        navigation,
        route,
        colors,
      ),
    );
  };

  componentDidMount = () => {
    const { mode } = this.state;
    // @ts-expect-error -- legacy JavaScript UI type boundary
    const { navigation } = this.props;
    this.updateNavBar();
    // Workaround https://github.com/facebook/react-native/issues/9958
    this.state.inputWidth &&
      setTimeout(() => {
        this.setState({ inputWidth: '100%' });
      }, 100);
    if (mode === EDIT) {
      // @ts-expect-error -- legacy JavaScript UI type boundary
      const { addressBook, chainId, internalAccounts } = this.props;
      const networkAddressBook = addressBook[chainId] || {};
      // @ts-expect-error -- legacy JavaScript UI type boundary
      const address = this.props.route.params?.address ?? '';
      const contact =
        networkAddressBook[address] ||
        (address &&
          // @ts-expect-error -- legacy JavaScript UI type boundary
          internalAccounts.find((account) =>
            toLowerCaseEquals(account.address, address),
          ));
      this.setState({
        address,
        name: contact?.name ?? '',
        memo: contact?.memo ?? '',
        addressReady: true,
        editable: false,
      });
      navigation && navigation.setParams({ dispatch: this.onEdit, mode: EDIT });
    }
  };

  componentDidUpdate = () => {
    this.updateNavBar();
  };

  onEdit = () => {
    // @ts-expect-error -- legacy JavaScript UI type boundary
    const { navigation } = this.props;
    const { editable } = this.state;
    if (editable) navigation.setParams({ editMode: EDIT });
    else navigation.setParams({ editMode: ADD });

    this.setState({ editable: !editable });
  };

  onDelete = () => {
    // @ts-expect-error -- legacy JavaScript UI type boundary
    this.contactAddressToRemove = this.state.address;
    // @ts-expect-error -- legacy JavaScript UI type boundary
    this.actionSheet && this.actionSheet.show();
  };

  // @ts-expect-error -- legacy JavaScript UI type boundary
  onChangeName = (name) => {
    this.setState({ name });
  };

  // @ts-expect-error -- legacy JavaScript UI type boundary
  validateAddressOrENSFromInput = async (address) => {
    // @ts-expect-error -- legacy JavaScript UI type boundary
    const { addressBook, internalAccounts, chainId } = this.props;

    const {
      addressError,
      toEnsName,
      addressReady,
      toEnsAddress,
      errorContinue,
    } = await validateAddressOrENS(
      address,
      addressBook,
      internalAccounts,
      chainId,
    );

    this.setState({
      addressError,
      toEnsName,
      addressReady,
      toEnsAddress,
      errorContinue,
    });
  };

  // @ts-expect-error -- legacy JavaScript UI type boundary
  onChangeAddress = (address) => {
    this.validateAddressOrENSFromInput(address);
    this.setState({ address });
  };

  // @ts-expect-error -- legacy JavaScript UI type boundary
  onChangeMemo = (memo) => {
    this.setState({ memo });
  };

  jumpToAddressInput = () => {
    const { current } = this.addressInput;
    // @ts-expect-error -- legacy JavaScript UI type boundary
    current && current.focus();
  };

  jumpToMemoInput = () => {
    const { current } = this.memoInput;
    // @ts-expect-error -- legacy JavaScript UI type boundary
    current && current.focus();
  };

  saveContact = () => {
    const { name, address, memo, toEnsAddress } = this.state;
    // @ts-expect-error -- legacy JavaScript UI type boundary
    const { chainId, navigation } = this.props;
    const { AddressBookController } = Engine.context;
    if (!name || !address) return;
    AddressBookController.set(
      toChecksumAddress(toEnsAddress || address),
      name,
      chainId,
      // @ts-expect-error -- legacy JavaScript UI type boundary
      memo,
    );
    navigation.pop();
  };

  deleteContact = () => {
    const { AddressBookController } = Engine.context;
    // @ts-expect-error -- legacy JavaScript UI type boundary
    const { chainId, navigation, route } = this.props;
    // @ts-expect-error -- legacy JavaScript UI type boundary
    AddressBookController.delete(chainId, this.contactAddressToRemove);
    route.params.onDelete();
    navigation.pop();
  };

  onScan = () => {
    // @ts-expect-error -- legacy JavaScript UI type boundary
    this.props.navigation.navigate(
      ...createQRScannerNavDetails({
        onScanSuccess: (meta) => {
          if (meta.target_address) {
            this.onChangeAddress(meta.target_address);
          }
        },
        origin: Routes.SETTINGS.CONTACT_FORM,
      }),
    );
  };

  // @ts-expect-error -- legacy JavaScript UI type boundary
  createActionSheetRef = (ref) => {
    this.actionSheet = ref;
  };

  // @ts-expect-error -- legacy JavaScript UI type boundary
  renderErrorMessage = (addressError) => {
    let errorMessage = addressError;

    if (addressError === CONTACT_ALREADY_SAVED) {
      errorMessage = strings('address_book.address_already_saved');
    }
    if (addressError === SYMBOL_ERROR) {
      errorMessage = `${
        strings('transaction.tokenContractAddressWarning_1') +
        strings('transaction.tokenContractAddressWarning_2') +
        strings('transaction.tokenContractAddressWarning_3')
      }`;
    }

    return errorMessage;
  };

  onErrorContinue = () => {
    this.setState({ addressError: null });
  };

  render = () => {
    const {
      address,
      addressError,
      toEnsName,
      name,
      mode,
      addressReady,
      memo,
      editable,
      inputWidth,
      toEnsAddress,
      // @ts-expect-error -- legacy JavaScript UI type boundary
      errorContinue,
    } = this.state;
    // @ts-expect-error -- legacy JavaScript UI type boundary
    const colors = this.context.colors || mockTheme.colors;
    // @ts-expect-error -- legacy JavaScript UI type boundary
    const themeAppearance = this.context.themeAppearance || 'light';
    const styles = createStyles(colors);

    return (
      <SafeAreaView
        style={styles.wrapper}
        testID={AddContactViewSelectorsIDs.CONTAINER}
      >
        <KeyboardAwareScrollView style={styles.informationWrapper}>
          <View style={styles.scrollWrapper}>
            <Text style={styles.label}>{strings('address_book.name')}</Text>
            {/* @ts-expect-error -- legacy JavaScript UI type boundary */}
            <TextInput
              editable={this.state.editable}
              autoCapitalize={'none'}
              autoCorrect={false}
              onChangeText={this.onChangeName}
              placeholder={strings('address_book.nickname')}
              placeholderTextColor={colors.text.muted}
              spellCheck={false}
              numberOfLines={1}
              style={[
                styles.input,
                inputWidth ? { width: inputWidth } : {},
                editable ? {} : styles.textInputDisaled,
              ]}
              value={name}
              onSubmitEditing={this.jumpToAddressInput}
              testID={AddContactViewSelectorsIDs.NAME_INPUT}
              keyboardAppearance={themeAppearance}
            />

            <Text style={styles.label}>{strings('address_book.address')}</Text>
            <View
              style={[styles.input, editable ? {} : styles.textInputDisaled]}
            >
              <View style={styles.inputWrapper}>
                {/* @ts-expect-error -- legacy JavaScript UI type boundary */}
                <TextInput
                  editable={editable}
                  autoCapitalize={'none'}
                  autoCorrect={false}
                  onChangeText={this.onChangeAddress}
                  placeholder={strings('address_book.add_input_placeholder')}
                  placeholderTextColor={colors.text.muted}
                  spellCheck={false}
                  numberOfLines={1}
                  style={[
                    styles.textInput,
                    inputWidth ? { width: inputWidth } : {},
                  ]}
                  value={toEnsName || address}
                  ref={this.addressInput}
                  onSubmitEditing={this.jumpToMemoInput}
                  testID={AddContactViewSelectorsIDs.ADDRESS_INPUT}
                  keyboardAppearance={themeAppearance}
                />
                {toEnsName && toEnsAddress && (
                  <Text style={styles.resolvedInput}>
                    {renderShortAddress(toEnsAddress)}
                  </Text>
                )}
              </View>

              {editable && (
                <TouchableOpacity
                  onPress={this.onScan}
                  style={styles.iconWrapper}
                >
                  <AntIcon
                    name="scan1"
                    size={20}
                    color={colors.primary.default}
                    style={styles.scanIcon}
                  />
                </TouchableOpacity>
              )}
            </View>

            <Text style={styles.label}>{strings('address_book.memo')}</Text>
            <View
              style={[styles.input, editable ? {} : styles.textInputDisaled]}
            >
              <View style={styles.inputWrapper}>
                {/* @ts-expect-error -- legacy JavaScript UI type boundary */}
                <TextInput
                  multiline
                  editable={editable}
                  autoCapitalize={'none'}
                  autoCorrect={false}
                  onChangeText={this.onChangeMemo}
                  placeholder={strings('address_book.memo')}
                  placeholderTextColor={colors.text.muted}
                  spellCheck={false}
                  numberOfLines={1}
                  style={[
                    styles.textInput,
                    inputWidth ? { width: inputWidth } : {},
                  ]}
                  value={memo}
                  ref={this.memoInput}
                  testID={AddContactViewSelectorsIDs.MEMO_INPUT}
                  keyboardAppearance={themeAppearance}
                />
              </View>
            </View>
          </View>

          {addressError && (
            <ErrorMessage
              errorMessage={this.renderErrorMessage(addressError)}
              errorContinue={!!errorContinue}
              onContinue={this.onErrorContinue}
            />
          )}

          {!!editable && (
            <View style={styles.buttonsWrapper}>
              <View style={styles.buttonsContainer}>
                <View style={styles.actionButton}>
                  <StyledButton
                    type={'confirm'}
                    disabled={!addressReady || !name || !!addressError}
                    onPress={this.saveContact}
                    testID={AddContactViewSelectorsIDs.ADD_BUTTON}
                  >
                    {strings(`address_book.${mode}_contact`)}
                  </StyledButton>
                </View>
                {mode === EDIT && (
                  <View style={styles.actionButton}>
                    <StyledButton
                      style={styles.actionButton}
                      type={'warning-empty'}
                      disabled={!addressReady || !name || !!addressError}
                      onPress={this.onDelete}
                      testID={AddContactViewSelectorsIDs.DELETE_BUTTON}
                    >
                      {strings(`address_book.delete`)}
                    </StyledButton>
                  </View>
                )}
              </View>
            </View>
          )}
          <ActionSheet
            ref={this.createActionSheetRef}
            title={strings('address_book.delete_contact')}
            options={[
              strings('address_book.delete'),
              strings('address_book.cancel'),
            ]}
            cancelButtonIndex={1}
            destructiveButtonIndex={0}
            // eslint-disable-next-line react/jsx-no-bind
            // @ts-expect-error -- legacy JavaScript UI type boundary
            onPress={(index) => (index === 0 ? this.deleteContact() : null)}
            theme={themeAppearance}
          />
        </KeyboardAwareScrollView>
      </SafeAreaView>
    );
  };
}

ContactForm.contextType = ThemeContext;

// @ts-expect-error -- legacy JavaScript UI type boundary
const mapStateToProps = (state) => ({
  addressBook: selectAddressBook(state),
  internalAccounts: selectInternalAccounts(state),
  chainId: selectEvmChainId(state),
});

export default connect(mapStateToProps)(ContactForm);

interface ContactFormProps {
  addressBook?: Record<string, any>;
  chainId?: string;
  internalAccounts?: any[];
  navigation?: Record<string, any>;
  route?: Record<string, any>;
}
type Props = ContactFormProps;
