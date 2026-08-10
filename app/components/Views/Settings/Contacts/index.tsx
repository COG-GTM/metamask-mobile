import React, { PureComponent } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import type { NavigationProp, ParamListBase } from '@react-navigation/native';
import type { ThemeColors } from '@metamask/design-tokens';
import type { Theme } from '../../../../util/theme/models';
import type { AddressBookControllerState } from '@metamask/address-book-controller';
import type { Hex } from '@metamask/utils';
import { strings } from '../../../../../locales/i18n';
import { getNavigationOptionsTitle } from '../../../UI/Navbar';
import { connect } from 'react-redux';
import AddressList from '../../confirmations/legacy/SendFlow/AddressList';
import type { AddressListProps } from '../../confirmations/legacy/SendFlow/AddressList/AddressList.types';
import StyledButton from '../../../UI/StyledButton';
import Engine from '../../../../core/Engine';
import ActionSheet from '@metamask/react-native-actionsheet';
import { mockTheme, ThemeContext } from '../../../../util/theme';
import { selectChainId } from '../../../../selectors/networkController';
import Routes from '../../../../../app/constants/navigation/Routes';

import { ContactsViewSelectorIDs } from '../../../../../e2e/selectors/Settings/Contacts/ContacsView.selectors';
import { selectAddressBook } from '../../../../selectors/addressBookController';
import { RootState } from '../../../../reducers';

const createStyles = (colors: ThemeColors) =>
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

interface OwnProps {
  /**
   * navigation object required to push new views
   */
  navigation: NavigationProp<ParamListBase>;
}

type StateProps = ReturnType<typeof mapStateToProps>;
type ContactsProps = OwnProps & StateProps;

interface ContactsState {
  reloadAddressList: boolean;
}

// AddressList is untyped JS, its inferred props mark `inputSearch` as required
const AddressListView = AddressList as unknown as React.ComponentType<
  AddressListProps & { chainId: Hex }
>;

/**
 * View that contains app information
 */
class Contacts extends PureComponent<ContactsProps, ContactsState> {
  // Props are injected by connect() and the navigator
  static defaultProps: Partial<ContactsProps> = {};

  state: ContactsState = {
    reloadAddressList: false,
  };

  actionSheet: ActionSheetRef | null = null;
  contactAddressToRemove: string | undefined;

  updateNavBar = () => {
    const { navigation } = this.props;
    const colors =
      (this.context as unknown as Theme)?.colors || mockTheme.colors;
    navigation.setOptions(
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
      JSON.stringify(prevProps.addressBook[chainId]) !==
        JSON.stringify(this.props.addressBook[chainId])
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
    AddressBookController.delete(chainId, this.contactAddressToRemove as Hex);
    this.updateAddressList();
  };

  onAddressPress = (address: string) => {
    this.props.navigation.navigate('ContactForm', {
      mode: EDIT,
      editMode: EDIT,
      address,
      onDelete: () => this.updateAddressList(),
    });
  };

  goToAddContact = () => {
    this.props.navigation.navigate('ContactForm', { mode: ADD });
  };

  createActionSheetRef = (ref: ActionSheetRef | null) => {
    this.actionSheet = ref;
  };

  onIconPress = () => {
    const { navigation } = this.props;
    navigation.navigate(Routes.MODAL.ROOT_MODAL_FLOW, {
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
        <AddressListView
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
          onPress={(index: number) => (index === 0 ? this.deleteContact() : null)}
          theme={themeAppearance}
        />
      </SafeAreaView>
    );
  };
}

Contacts.contextType = ThemeContext;

const mapStateToProps = (
  state: RootState,
): {
  addressBook: AddressBookControllerState['addressBook'];
  chainId: Hex;
} => ({
  addressBook: selectAddressBook(state),
  chainId: selectChainId(state) as Hex,
});

export default connect(mapStateToProps)(Contacts);
