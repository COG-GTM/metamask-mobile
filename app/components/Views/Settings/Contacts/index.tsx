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
import { Theme } from '../../../../util/theme/models';
import { RootState } from '../../../../reducers';
import { selectChainId } from '../../../../selectors/networkController';
import Routes from '../../../../../app/constants/navigation/Routes';
import type { Hex } from '@metamask/utils';

import { ContactsViewSelectorIDs } from '../../../../../e2e/selectors/Settings/Contacts/ContacsView.selectors';
import { selectAddressBook } from '../../../../selectors/addressBookController';

const createStyles = (colors: Theme['colors']) =>
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

interface ContactsNavigation {
  setOptions: (
    options: ReturnType<typeof getNavigationOptionsTitle>,
  ) => void;
  navigate: (
    name: string,
    params: {
      screen?: string;
      mode?: string;
      editMode?: string;
      address?: string;
      onDelete?: () => void;
    },
  ) => void;
}

/**
 * The action sheet exposes itself through a ref callback rather than a ref
 * object, and only its `show` method is used here.
 */
interface ActionSheetInstance {
  show: () => void;
}

interface OwnProps {
  /**
   /* navigation object required to push new views
   */
  navigation?: ContactsNavigation;
}

interface StateProps {
  /**
   * Map representing the address book
   */
  addressBook: ReturnType<typeof selectAddressBook>;
  /**
   * The chain ID for the current selected network
   */
  chainId: ReturnType<typeof selectChainId>;
}

type ContactsProps = OwnProps & StateProps;

interface AddressListProps {
  chainId: string;
  onlyRenderAddressBook?: boolean;
  reloadAddressList: boolean;
  onAccountPress: (address: string) => void;
  onIconPress: () => void;
  onAccountLongPress: (address: string) => void;
}

// `AddressList` is still untyped JavaScript owned by the send flow.
const AddressBookList = AddressList as unknown as React.ComponentType<AddressListProps>;

interface ContactsState {
  reloadAddressList: boolean;
}

/**
 * View that contains app information
 */
class Contacts extends PureComponent<ContactsProps, ContactsState> {
  state: ContactsState = {
    reloadAddressList: false,
  };

  actionSheet: ActionSheetInstance | null = null;
  contactAddressToRemove: string | null = null;

  updateNavBar = () => {
    const { navigation } = this.props;
    const colors =
      (this.context as unknown as Theme)?.colors || mockTheme.colors;
    navigation?.setOptions(
      getNavigationOptionsTitle(
        strings('app_settings.contacts_title'),
        navigation,
        false,
        colors,
      ),
    );
  };

  componentDidMount = () => {
    this.updateNavBar();
  };

  componentDidUpdate = (prevProps: ContactsProps) => {
    this.updateNavBar();
    const { chainId } = this.props;
    if (
      prevProps.addressBook &&
      this.props.addressBook &&
      JSON.stringify(prevProps.addressBook[chainId as Hex]) !==
        JSON.stringify(this.props.addressBook[chainId as Hex])
    )
      this.updateAddressList();
  };

  updateAddressList = () => {
    this.setState({ reloadAddressList: true });
    setTimeout(() => {
      this.setState({ reloadAddressList: false });
    }, 100);
  };

  onAddressLongPress = (address: string) => {
    this.contactAddressToRemove = address;
    this.actionSheet && this.actionSheet.show();
  };

  deleteContact = () => {
    const { AddressBookController } = Engine.context;
    const { chainId } = this.props;
    if (this.contactAddressToRemove) {
      AddressBookController.delete(chainId as Hex, this.contactAddressToRemove);
    }
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

  createActionSheetRef = (ref: ActionSheetInstance | null) => {
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
    const theme = this.context as unknown as Theme;
    const colors = theme?.colors || mockTheme.colors;
    const themeAppearance = theme?.themeAppearance;
    const styles = createStyles(colors);
    const { chainId } = this.props;

    return (
      <SafeAreaView
        style={styles.wrapper}
        testID={ContactsViewSelectorIDs.CONTAINER}
      >
        <AddressBookList
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

Contacts.contextType = ThemeContext;

const mapStateToProps = (state: RootState): StateProps => ({
  addressBook: selectAddressBook(state),
  chainId: selectChainId(state),
});

export default connect(mapStateToProps)(Contacts);
