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
import { selectEvmChainId } from '../../../../selectors/networkController';
import Routes from '../../../../../app/constants/navigation/Routes';

import { ContactsViewSelectorIDs } from '../../../../../e2e/selectors/Settings/Contacts/ContacsView.selectors';
import { selectAddressBook } from '../../../../selectors/addressBookController';
import type { NavigationProp, ParamListBase } from '@react-navigation/native';
import type { Theme } from '../../../../util/theme/models';
import type { RootState } from '../../../../reducers';
import type { AddressBookControllerState } from '@metamask/address-book-controller';

interface AddressListProps {
  chainId: ReturnType<typeof selectEvmChainId>;
  onlyRenderAddressBook: boolean;
  reloadAddressList: boolean;
  onAccountPress: (address: string) => void;
  onIconPress: () => void;
  onAccountLongPress: (address: string) => void;
}

const TypedAddressList =
  AddressList as unknown as React.ComponentType<AddressListProps>;

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

/**
 * View that contains app information
 */
interface State {
  reloadAddressList: boolean;
}

interface OwnProps {
  /**
     /* navigation object required to push new views
     */
  navigation: NavigationProp<ParamListBase>;
}

interface StateProps {
  addressBook: AddressBookControllerState['addressBook'];
  chainId: ReturnType<typeof selectEvmChainId>;
}

type Props = OwnProps & StateProps;

class Contacts extends PureComponent<Props, State> {
  static contextType = ThemeContext;

  state: State = {
    reloadAddressList: false,
  };

  actionSheet: { show: () => void } | null = null;
  contactAddressToRemove: string | null = null;

  updateNavBar = () => {
    const { navigation } = this.props;
    const colors =
      (this.context as unknown as Theme).colors || mockTheme.colors;
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
    if (!this.contactAddressToRemove) {
      return;
    }
    AddressBookController.delete(chainId, this.contactAddressToRemove);
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

  createActionSheetRef = (ref: { show: () => void } | null) => {
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
    const colors =
      (this.context as unknown as Theme).colors || mockTheme.colors;
    const themeAppearance = (this.context as unknown as Theme).themeAppearance;
    const styles = createStyles(colors);
    const { chainId } = this.props;

    return (
      <SafeAreaView
        style={styles.wrapper}
        testID={ContactsViewSelectorIDs.CONTAINER}
      >
        <TypedAddressList
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
  addressBook: selectAddressBook(state),
  chainId: selectEvmChainId(state),
});

const ConnectedContacts = connect(mapStateToProps)(Contacts);

interface TestCompatibleProps {
  navigation?: object;
  [key: string]: unknown;
}

export default ConnectedContacts as unknown as React.ComponentType<TestCompatibleProps>;
