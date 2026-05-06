import React, { PureComponent } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';

import { strings } from '../../../../../locales/i18n';
import { getNavigationOptionsTitle } from '../../../UI/Navbar';
import { connect } from 'react-redux';
import AddressList from '../../confirmations/legacy/SendFlow/AddressList';
import StyledButton from '../../../UI/StyledButton';
import Engine from '../../../../core/Engine';
import ActionSheet from '@metamask/react-native-actionsheet';
import { mockTheme, ThemeContext } from '../../../../util/theme';
import { selectChainId } from '../../../../selectors/networkController';
import Routes from '../../../../../app/constants/navigation/Routes';

import { ContactsViewSelectorIDs } from '../../../../../e2e/selectors/Settings/Contacts/ContacsView.selectors';
import { selectAddressBook } from '../../../../selectors/addressBookController';

interface NavigationLike {
  navigate: (route: string, params?: Record<string, unknown>) => void;
  setOptions: (opts: Record<string, unknown>) => void;
}

interface AddressBookEntry {
  [address: string]: unknown;
}

interface Props {
  navigation?: NavigationLike;
  chainId?: `0x${string}`;
  addressBook?: Record<string, AddressBookEntry>;
}

interface State {
  reloadAddressList: boolean;
}

interface ColorTokens {
  background: { default: string };
  [key: string]: unknown;
}

const createStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    wrapper: {
      backgroundColor: colors.background.default,
      flex: 1,
      marginTop: 16,
    },
    addContact: {
      marginHorizontal: 24,
      marginBottom: 16,
    },
  });

const EDIT = 'edit';
const ADD = 'add';

interface ActionSheetRef {
  show: () => void;
}

/**
 * View that contains app information
 */
class Contacts extends PureComponent<Props, State> {
  state: State = {
    reloadAddressList: false,
  };

  actionSheet: ActionSheetRef | null = null;

  contactAddressToRemove: `0x${string}` | undefined;

  static contextType = ThemeContext;

  declare context: React.ContextType<typeof ThemeContext>;

  updateNavBar = () => {
    const { navigation } = this.props;
    if (!navigation) return;
    const colors = (this.context?.colors || mockTheme.colors) as ColorTokens;
    (navigation as { setOptions: (opts: unknown) => void }).setOptions(
      getNavigationOptionsTitle(
        strings('app_settings.contacts_title'),
        navigation as unknown as Record<string, unknown>,
        false,
        colors as unknown as Record<string, unknown>,
      ),
    );
  };

  componentDidMount = () => {
    this.updateNavBar();
  };

  componentDidUpdate = (prevProps: Props) => {
    this.updateNavBar();
    const { chainId } = this.props;
    if (!chainId) return;
    const prevBook = prevProps.addressBook;
    const currBook = this.props.addressBook;
    if (
      prevBook &&
      currBook &&
      JSON.stringify(prevBook[chainId]) !== JSON.stringify(currBook[chainId])
    ) {
      this.updateAddressList();
    }
  };

  updateAddressList = () => {
    this.setState({ reloadAddressList: true });
    setTimeout(() => {
      this.setState({ reloadAddressList: false });
    }, 100);
  };

  onAddressLongPress = (address: string) => {
    this.contactAddressToRemove = address as `0x${string}`;
    if (this.actionSheet) this.actionSheet.show();
  };

  deleteContact = () => {
    const { AddressBookController } = Engine.context;
    const { chainId } = this.props;
    if (!chainId || !this.contactAddressToRemove) return;
    AddressBookController.delete(chainId, this.contactAddressToRemove);
    this.updateAddressList();
  };

  onAddressPress = (address: string) => {
    this.props.navigation?.navigate('ContactForm', {
      mode: EDIT,
      editMode: EDIT,
      address,
      onDelete: () => this.updateAddressList(),
    });
  };

  goToAddContact = () => {
    this.props.navigation?.navigate('ContactForm', { mode: ADD });
  };

  createActionSheetRef = (ref: ActionSheetRef | null) => {
    this.actionSheet = ref;
  };

  onIconPress = () => {
    const { navigation } = this.props;
    navigation?.navigate(Routes.MODAL.ROOT_MODAL_FLOW, {
      screen: Routes.SHEET.AMBIGUOUS_ADDRESS,
    });
  };

  render = () => {
    const { reloadAddressList } = this.state;
    const colors = (this.context?.colors || mockTheme.colors) as ColorTokens;
    const themeAppearance = this.context?.themeAppearance;
    const styles = createStyles(colors);
    const { chainId } = this.props;

    const AddressListUntyped = AddressList as unknown as React.ComponentType<{
      chainId: unknown;
      inputSearch?: unknown;
      onlyRenderAddressBook?: boolean;
      reloadAddressList: boolean;
      onAccountPress: (address: string) => void;
      onIconPress: () => void;
      onAccountLongPress: (address: string) => void;
    }>;

    return (
      <SafeAreaView
        style={styles.wrapper}
        testID={ContactsViewSelectorIDs.CONTAINER}
      >
        <AddressListUntyped
          chainId={chainId}
          onlyRenderAddressBook
          reloadAddressList={reloadAddressList}
          onAccountPress={this.onAddressPress}
          onIconPress={this.onIconPress}
          onAccountLongPress={this.onAddressLongPress}
        />
        <StyledButton
          type={'confirm'}
          containerStyle={styles.addContact}
          onPress={this.goToAddContact}
          testID={ContactsViewSelectorIDs.ADD_BUTTON}
        >
          {strings('address_book.add_contact')}
        </StyledButton>
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
      </SafeAreaView>
    );
  };
}

const mapStateToProps = (rawState: Record<string, Record<string, unknown>>) => {
  const state = rawState as unknown as Parameters<typeof selectChainId>[0];
  return {
    addressBook: selectAddressBook(
      state as unknown as Parameters<typeof selectAddressBook>[0],
    ) as unknown as Record<string, AddressBookEntry> | undefined,
    chainId: selectChainId(state) as `0x${string}` | undefined,
  };
};

export default connect(mapStateToProps)(Contacts);
