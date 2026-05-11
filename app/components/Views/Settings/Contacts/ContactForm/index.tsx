import React, { PureComponent } from 'react';
import {
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type TextInput as TextInputType,
} from 'react-native';
import { fontStyles } from '../../../../../styles/common';
import type { RootState } from '../../../../../reducers';
import type { InternalAccount } from '@metamask/keyring-internal-api';
import type { AddressBookEntry } from '@metamask/address-book-controller';
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

interface ThemeColors {
  background: { default: string };
  border: { default: string };
  text: { default: string; muted: string };
  primary: { default: string };
  transparent: string;
}

const createStyles = (colors: ThemeColors) =>
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

interface ContactFormNavigation {
  setOptions: (options: object) => void;
  setParams: (params: object) => void;
  navigate: (...args: unknown[]) => void;
  pop: () => void;
  goBack?: () => void;
}

interface ContactFormRoute {
  params?: {
    mode?: 'add' | 'edit';
    address?: string;
    onDelete?: () => void;
    [key: string]: unknown;
  };
}

interface OwnProps {
  navigation: ContactFormNavigation;
  route: ContactFormRoute;
}

interface StateProps {
  internalAccounts: InternalAccount[];
  addressBook: Record<string, Record<string, AddressBookEntry>>;
  chainId: string;
}

type Props = OwnProps & StateProps;

interface State {
  name: string | null;
  address: string | null;
  addressError: string | null;
  toEnsName: string | null;
  toEnsAddress: string | null;
  addressReady: boolean;
  mode: 'add' | 'edit';
  memo: string | null;
  editable: boolean;
  inputWidth: string | undefined;
  errorContinue?: boolean;
}

interface ActionSheetInstance {
  show: () => void;
}

/**
 * View that contains app information
 */
class ContactForm extends PureComponent<Props, State> {
  static contextType = ThemeContext;

  declare context: React.ContextType<typeof ThemeContext>;

  contactAddressToRemove: string | null = null;

  state: State = {
    name: null,
    address: null,
    addressError: null,
    toEnsName: null,
    toEnsAddress: null,
    addressReady: false,
    mode: (this.props.route.params?.mode as 'add' | 'edit') ?? ADD,
    memo: null,
    editable: true,
    inputWidth: Platform.OS === 'android' ? '99%' : undefined,
  };

  actionSheet: ActionSheetInstance | null = null;
  addressInput = React.createRef<TextInputType>();
  memoInput = React.createRef<TextInputType>();

  updateNavBar = () => {
    const { navigation, route } = this.props;
    const colors =
      (this.context as { colors?: typeof mockTheme.colors })?.colors ||
      mockTheme.colors;
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
    const { navigation } = this.props;
    this.updateNavBar();
    // Workaround https://github.com/facebook/react-native/issues/9958
    this.state.inputWidth &&
      setTimeout(() => {
        this.setState({ inputWidth: '100%' });
      }, 100);
    if (mode === EDIT) {
      const { addressBook, chainId, internalAccounts } = this.props;
      const networkAddressBook = addressBook[chainId] || {};
      const address = this.props.route.params?.address ?? '';
      const contact =
        networkAddressBook[address] ||
        (address &&
          internalAccounts.find((account) =>
            toLowerCaseEquals(account.address, address),
          ));
      this.setState({
        address,
        name: (contact as { name?: string } | undefined)?.name ?? '',
        memo:
          (contact as { memo?: string } | undefined)?.memo ?? '',
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
    const { navigation } = this.props;
    const { editable } = this.state;
    if (editable) navigation.setParams({ editMode: EDIT });
    else navigation.setParams({ editMode: ADD });

    this.setState({ editable: !editable });
  };

  onDelete = () => {
    this.contactAddressToRemove = this.state.address;
    this.actionSheet && this.actionSheet.show();
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
    } = await validateAddressOrENS(
      address,
      addressBook as unknown as Parameters<typeof validateAddressOrENS>[1],
      internalAccounts,
      chainId as `0x${string}`,
    );

    this.setState({
      addressError: addressError ?? null,
      toEnsName: toEnsName ?? null,
      addressReady,
      toEnsAddress: toEnsAddress ?? null,
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
    if (!name || !address) return;
    AddressBookController.set(
      toChecksumAddress(toEnsAddress || address) as `0x${string}`,
      name,
      chainId as `0x${string}`,
      memo ?? undefined,
    );
    navigation.pop();
  };

  deleteContact = () => {
    const { AddressBookController } = Engine.context;
    const { chainId, navigation, route } = this.props;
    if (this.contactAddressToRemove) {
      AddressBookController.delete(
        chainId as `0x${string}`,
        this.contactAddressToRemove as `0x${string}`,
      );
    }
    route.params?.onDelete?.();
    navigation.pop();
  };

  onScan = () => {
    this.props.navigation.navigate(
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

  createActionSheetRef = (ref: ActionSheetInstance | null) => {
    this.actionSheet = ref;
  };

  renderErrorMessage = (addressError: string) => {
    let errorMessage: string = addressError;

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
    const colors =
      (this.context as { colors?: typeof mockTheme.colors })?.colors ||
      mockTheme.colors;
    const themeAppearance =
      (this.context as { themeAppearance?: string })?.themeAppearance || 'light';
    const styles = createStyles(colors as unknown as ThemeColors);

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
                inputWidth ? ({ width: inputWidth as '99%' | '100%' }) : {},
                editable ? {} : styles.textInputDisaled,
              ]}
              value={name ?? ''}
              onSubmitEditing={this.jumpToAddressInput}
              testID={AddContactViewSelectorsIDs.NAME_INPUT}
              keyboardAppearance={
                themeAppearance as 'light' | 'dark' | 'default'
              }
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
                    inputWidth ? ({ width: inputWidth as '99%' | '100%' }) : {},
                  ]}
                  value={toEnsName || address || ''}
                  ref={this.addressInput}
                  onSubmitEditing={this.jumpToMemoInput}
                  testID={AddContactViewSelectorsIDs.ADDRESS_INPUT}
                  keyboardAppearance={
                    themeAppearance as 'light' | 'dark' | 'default'
                  }
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
                    inputWidth ? ({ width: inputWidth as '99%' | '100%' }) : {},
                  ]}
                  value={memo ?? ''}
                  ref={this.memoInput}
                  testID={AddContactViewSelectorsIDs.MEMO_INPUT}
                  keyboardAppearance={
                    themeAppearance as 'light' | 'dark' | 'default'
                  }
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

const mapStateToProps = (state: RootState): StateProps => ({
  addressBook: selectAddressBook(state) as unknown as Record<
    string,
    Record<string, AddressBookEntry>
  >,
  internalAccounts: selectInternalAccounts(
    state,
  ) as unknown as InternalAccount[],
  chainId: selectEvmChainId(state),
});

export default connect(mapStateToProps)(ContactForm);
