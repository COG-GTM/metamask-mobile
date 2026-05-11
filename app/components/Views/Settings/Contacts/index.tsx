import React, { PureComponent, type ComponentType } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { strings } from '../../../../../locales/i18n';
import { getNavigationOptionsTitle } from '../../../UI/Navbar';
import { connect } from 'react-redux';
import AddressListBase from '../../confirmations/legacy/SendFlow/AddressList';
import StyledButton from '../../../UI/StyledButton';
import Engine from '../../../../core/Engine';
import ActionSheet from '@metamask/react-native-actionsheet';
import { mockTheme, ThemeContext } from '../../../../util/theme';
import { selectChainId } from '../../../../selectors/networkController';
import Routes from '../../../../../app/constants/navigation/Routes';

import { ContactsViewSelectorIDs } from '../../../../../e2e/selectors/Settings/Contacts/ContacsView.selectors';
import { selectAddressBook } from '../../../../selectors/addressBookController';
import { RootState } from '../../../../reducers';
import type { AddressBookEntry } from '@metamask/address-book-controller';
import type { Hex } from '@metamask/utils';
import type { NavigationProp, ParamListBase } from '@react-navigation/native';

interface AddressListExtraProps {
  chainId: Hex;
  inputSearch?: string;
  onAccountPress: (address: string) => void;
  onAccountLongPress: (address: string) => void;
  onIconPress: () => void;
  onlyRenderAddressBook?: boolean;
  reloadAddressList?: boolean;
}

const AddressList =
  AddressListBase as unknown as ComponentType<AddressListExtraProps>;

const createStyles = (colors: { background: { default: string } }) =>
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

interface AddressBook {
  [chainId: Hex]: { [address: string]: AddressBookEntry };
}

interface OwnProps {
  /**
   * navigation object required to push new views
   */
  navigation?: NavigationProp<ParamListBase>;
}

interface StateProps {
  /**
   * Map representing the address book
   */
  addressBook: AddressBook;
  /**
   * The chain ID for the current selected network
   */
  chainId: Hex;
}

type Props = OwnProps & StateProps;

interface State {
  reloadAddressList: boolean;
}

/**
 * View that contains app information
 */
class Contacts extends PureComponent<Props, State> {
  static contextType = ThemeContext;

  declare context: React.ContextType<typeof ThemeContext>;

  state: State = {
    reloadAddressList: false,
  };

  actionSheet: InstanceType<typeof ActionSheet> | undefined;
  contactAddressToRemove: string | undefined;

  updateNavBar = () => {
    const { navigation } = this.props;
    if (!navigation) return;
    const colors =
      (this.context as { colors?: typeof mockTheme.colors })?.colors ||
      mockTheme.colors;
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

  componentDidUpdate = (prevProps: Props) => {
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
    if (this.contactAddressToRemove) {
      AddressBookController.delete(chainId, this.contactAddressToRemove);
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

  createActionSheetRef = (ref: InstanceType<typeof ActionSheet> | null) => {
    this.actionSheet = ref ?? undefined;
  };

  onIconPress = () => {
    const { navigation } = this.props;
    navigation?.navigate(Routes.MODAL.ROOT_MODAL_FLOW, {
      screen: Routes.SHEET.AMBIGUOUS_ADDRESS,
    });
  };

  render = () => {
    const { reloadAddressList } = this.state;
    const ctx = this.context as {
      colors?: typeof mockTheme.colors;
      themeAppearance?: string;
    };
    const colors = ctx?.colors || mockTheme.colors;
    const themeAppearance = ctx?.themeAppearance;
    const styles = createStyles(colors);
    const { chainId } = this.props;

    return (
      <SafeAreaView
        style={styles.wrapper}
        testID={ContactsViewSelectorIDs.CONTAINER}
      >
        <AddressList
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

const mapStateToProps = (state: RootState): StateProps => ({
  addressBook: selectAddressBook(state) as AddressBook,
  chainId: selectChainId(state) as Hex,
});

export default connect(mapStateToProps)(Contacts);
