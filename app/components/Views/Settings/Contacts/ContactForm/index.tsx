import React, { PureComponent } from 'react';
import {
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ViewStyle,
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

interface NavigationLike {
  navigate: (...args: unknown[]) => void;
  setOptions: (opts: Record<string, unknown>) => void;
  setParams: (params: Record<string, unknown>) => void;
  pop: () => void;
}
interface RouteLike {
  params?: {
    mode?: string;
    address?: string;
    onDelete?: () => void;
    [key: string]: unknown;
  };
}
interface InternalAccount {
  address?: string;
  [key: string]: unknown;
}
interface AddressBookEntry {
  name?: string;
  memo?: string;
  [key: string]: unknown;
}

interface Props {
  navigation?: NavigationLike;
  route?: RouteLike;
  addressBook?: Record<string, Record<string, AddressBookEntry>>;
  internalAccounts?: InternalAccount[];
  chainId?: `0x${string}`;
}
interface State {
  name: string | null;
  address: string | null;
  addressError: string | null;
  toEnsName: string | null;
  toEnsAddress: string | null;
  addressReady: boolean;
  mode: string;
  memo: string | null;
  editable: boolean;
  inputWidth: string | undefined;
  errorContinue?: boolean;
}
interface ColorTokens {
  background: { default: string };
  border: { default: string };
  text: { default: string; muted: string };
  primary: { default: string };
  transparent: string;
  [key: string]: unknown;
}

interface ActionSheetRef {
  show: () => void;
}

const createStyles = (colors: ColorTokens) =>
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
class ContactForm extends PureComponent<Props, State> {
  /* propTypes removed during JS→TS migration */

  state: State = {
    name: null,
    address: null,
    addressError: null,
    toEnsName: null,
    toEnsAddress: null,
    addressReady: false,
    mode: this.props.route?.params?.mode ?? ADD,
    memo: null,
    editable: true,
    inputWidth: Platform.OS === 'android' ? '99%' : undefined,
  };

  static contextType = ThemeContext;

  declare context: React.ContextType<typeof ThemeContext>;

  // The original code reassigns `actionSheet` from a createRef() to the ref
  // returned via `createActionSheetRef`. Keep that lax typing.
  actionSheet: ActionSheetRef | React.RefObject<ActionSheetRef> | null =
    React.createRef<ActionSheetRef>();

  addressInput = React.createRef<TextInput>();

  memoInput = React.createRef<TextInput>();

  contactAddressToRemove: string | null = null;

  updateNavBar = () => {
    const { navigation, route } = this.props;
    if (!navigation) return;
    const colors = (this.context?.colors || mockTheme.colors) as ColorTokens;
    (navigation as { setOptions: (opts: unknown) => void }).setOptions(
      getEditableOptions(
        strings(`address_book.${route?.params?.mode ?? ADD}_contact_title`),
        navigation as unknown as Record<string, unknown>,
        route as unknown as Record<string, unknown>,
        colors as unknown as Record<string, unknown>,
      ),
    );
  };

  componentDidMount = () => {
    const { mode } = this.state;
    const { navigation } = this.props;
    this.updateNavBar();
    // Workaround https://github.com/facebook/react-native/issues/9958
    this.state.inputWidth &&
      setTimeout(() => {
        this.setState({ inputWidth: '100%' });
      }, 100);
    if (mode === EDIT) {
      const { addressBook, chainId, internalAccounts } = this.props;
      const networkAddressBook =
        (addressBook && chainId && addressBook[chainId]) || {};
      const address = this.props.route?.params?.address ?? '';
      const contact =
        networkAddressBook[address] ||
        (address &&
          internalAccounts?.find((account: InternalAccount) =>
            toLowerCaseEquals(account.address, address),
          ));
      this.setState({
        address,
        name: contact?.name ?? '',
        memo: contact?.memo ?? '',
        addressReady: true,
        editable: false,
      });
      navigation &&
        navigation.setParams({ dispatch: this.onEdit, mode: EDIT });
    }
  };

  componentDidUpdate = () => {
    this.updateNavBar();
  };

  onEdit = () => {
    const { navigation } = this.props;
    const { editable } = this.state;
    if (editable) navigation?.setParams({ editMode: EDIT });
    else navigation?.setParams({ editMode: ADD });

    this.setState({ editable: !editable });
  };

  onDelete = () => {
    this.contactAddressToRemove = this.state.address;
    const sheet = this.actionSheet as ActionSheetRef | null;
    if (sheet && typeof sheet.show === 'function') sheet.show();
  };

  onChangeName = (name: string) => {
    this.setState({ name });
  };

  validateAddressOrENSFromInput = async (address: string) => {
    const { addressBook, internalAccounts, chainId } = this.props;

    const {
      addressError,
      toEnsName,
      addressReady,
      toEnsAddress,
      errorContinue,
    } = await (
      validateAddressOrENS as (
        a: string,
        b: unknown,
        c: unknown,
        d: unknown,
      ) => Promise<{
        addressError: string | null;
        toEnsName: string | null;
        addressReady: boolean;
        toEnsAddress: string | null;
        errorContinue?: boolean;
      }>
    )(address, addressBook, internalAccounts, chainId);

    this.setState({
      addressError,
      toEnsName,
      addressReady,
      toEnsAddress,
      errorContinue,
    });
  };

  onChangeAddress = (address: string) => {
    this.validateAddressOrENSFromInput(address);
    this.setState({ address });
  };

  onChangeMemo = (memo: string) => {
    this.setState({ memo });
  };

  jumpToAddressInput = () => {
    const { current } = this.addressInput;
    current && current.focus();
  };

  jumpToMemoInput = () => {
    const { current } = this.memoInput;
    current && current.focus();
  };

  saveContact = () => {
    const { name, address, memo, toEnsAddress } = this.state;
    const { chainId, navigation } = this.props;
    const { AddressBookController } = Engine.context;
    if (!name || !address || !chainId) return;
    AddressBookController.set(
      toChecksumAddress(toEnsAddress || address),
      name,
      chainId,
      memo ?? undefined,
    );
    navigation?.pop();
  };

  deleteContact = () => {
    const { AddressBookController } = Engine.context;
    const { chainId, navigation, route } = this.props;
    if (!this.contactAddressToRemove || !chainId) return;
    AddressBookController.delete(
      chainId,
      this.contactAddressToRemove as `0x${string}`,
    );
    route?.params?.onDelete?.();
    navigation?.pop();
  };

  onScan = () => {
    this.props.navigation?.navigate(
      ...createQRScannerNavDetails({
        onScanSuccess: (meta: { target_address?: string }) => {
          if (meta.target_address) {
            this.onChangeAddress(meta.target_address);
          }
        },
        origin: Routes.SETTINGS.CONTACT_FORM,
      }),
    );
  };

  createActionSheetRef = (ref: ActionSheetRef | null) => {
    this.actionSheet = ref;
  };

  renderErrorMessage = (addressError: string) => {
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
      errorContinue,
    } = this.state;
    const colors = (this.context?.colors || mockTheme.colors) as ColorTokens;
    const themeAppearance = this.context?.themeAppearance || 'light';
    const styles = createStyles(colors);

    return (
      <SafeAreaView
        style={styles.wrapper}
        testID={AddContactViewSelectorsIDs.CONTAINER}
      >
        <KeyboardAwareScrollView style={styles.informationWrapper}>
          <View style={styles.scrollWrapper}>
            <Text style={styles.label}>{strings('address_book.name')}</Text>
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
                inputWidth ? ({ width: inputWidth } as ViewStyle) : {},
                editable ? {} : styles.textInputDisaled,
              ]}
              value={name ?? ''}
              onSubmitEditing={this.jumpToAddressInput}
              testID={AddContactViewSelectorsIDs.NAME_INPUT}
              keyboardAppearance={themeAppearance}
            />

            <Text style={styles.label}>{strings('address_book.address')}</Text>
            <View
              style={[styles.input, editable ? {} : styles.textInputDisaled]}
            >
              <View style={styles.inputWrapper}>
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
                    inputWidth ? ({ width: inputWidth } as ViewStyle) : {},
                  ]}
                  value={(toEnsName || address) ?? ''}
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
                    inputWidth ? ({ width: inputWidth } as ViewStyle) : {},
                  ]}
                  value={memo ?? ''}
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
            onPress={(index: number) =>
              index === 0 ? this.deleteContact() : null
            }
            theme={themeAppearance}
          />
        </KeyboardAwareScrollView>
      </SafeAreaView>
    );
  };
}

const mapStateToProps = (rawState: Record<string, Record<string, unknown>>) => {
  const state = rawState as unknown as Parameters<typeof selectEvmChainId>[0];
  return {
    addressBook: selectAddressBook(
      state as unknown as Parameters<typeof selectAddressBook>[0],
    ) as unknown as Record<string, Record<string, AddressBookEntry>>,
    internalAccounts: selectInternalAccounts(
      state as unknown as Parameters<typeof selectInternalAccounts>[0],
    ) as unknown as InternalAccount[],
    chainId: selectEvmChainId(state) as `0x${string}`,
  };
};

export default connect(mapStateToProps)(ContactForm);
