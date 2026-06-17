import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { useSelector } from 'react-redux';
import Fuse from 'fuse.js';
import { Hex } from '@metamask/utils';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { isSmartContractAddress } from '../../../../../../util/transactions';
import { strings } from '../../../../../../../locales/i18n';
import AddressElement from '../AddressElement';
import { useTheme } from '../../../../../../util/theme';
import Text from '../../../../../../component-library/components/Texts/Text/Text';
import { TextVariant } from '../../../../../../component-library/components/Texts/Text';
import { regex } from '../../../../../../util/regex';
import { SendViewSelectorsIDs } from '../../../../../../../e2e/selectors/SendFlow/SendView.selectors';
import { selectInternalAccounts } from '../../../../../../selectors/accountsController';
import styleSheet from './AddressList.styles';
import { toChecksumHexAddress } from '@metamask/controller-utils';
import { selectAddressBook } from '../../../../../../selectors/addressBookController';
import { RootState } from '../../../../../../reducers';

// TODO: Replace "any" with type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AddressBookEntry = any;

type AddressListStyles = ReturnType<typeof styleSheet>;

interface AddressListProps {
  /**
   * Network id
   */
  chainId: Hex;
  /**
   * Search input text
   */
  inputSearch?: string;
  /**
   * Callback called when account is pressed
   */
  onAccountPress: (address: string) => void;
  /**
   * Callback called when account is long pressed
   */
  onAccountLongPress: (address: string) => void;
  /**
   * Callback called when account icon is pressed
   */
  onIconPress: () => void;
  /**
   * Whether only the address book entries should be rendered
   */
  onlyRenderAddressBook?: boolean;
  /**
   * Value used to trigger a reload of the address list
   */
  reloadAddressList?: boolean;
}

const LabelElement = (styles: AddressListStyles, label: string) => (
  <View key={label} style={styles.labelElementWrapper}>
    <Text variant={TextVariant.BodyMD} style={styles.contactLabel}>
      {label.toUpperCase()}
    </Text>
  </View>
);

const AddressList = ({
  chainId,
  inputSearch,
  onAccountPress,
  onAccountLongPress,
  onIconPress,
  onlyRenderAddressBook = false,
  reloadAddressList,
}: AddressListProps) => {
  const { colors } = useTheme();
  const styles = styleSheet(colors);
  const [contactElements, setContactElements] = useState<
    (string | AddressBookEntry)[]
  >([]);
  const [fuse, setFuse] = useState<Fuse<AddressBookEntry> | undefined>(
    undefined,
  );
  const internalAccounts = useSelector(selectInternalAccounts);
  const addressBook = useSelector(selectAddressBook);
  const ambiguousAddressEntries = useSelector(
    (state: RootState) => state.user.ambiguousAddressEntries,
  );

  const networkAddressBook = useMemo<Record<string, AddressBookEntry>>(
    () => addressBook[chainId] || {},
    [addressBook, chainId],
  );
  const parseAddressBook = useCallback(
    (networkAddressBookList: AddressBookEntry[]) => {
      const contacts = networkAddressBookList.map((contact) => {
        const isAmbiguousAddress =
          chainId &&
          (
            ambiguousAddressEntries?.[chainId] as string[] | undefined
          )?.includes(contact.address);
        return {
          ...contact,
          ...(isAmbiguousAddress && { isAmbiguousAddress }),
          isSmartContract: false,
        };
      });

      Promise.all(
        contacts.map((contact) =>
          isSmartContractAddress(contact.address, contact.chainId)
            .then((isSmartContract) => {
              if (isSmartContract) {
                return { ...contact, isSmartContract: true };
              }
              return contact;
            })
            .catch(() => contact),
        ),
      ).then((updatedContacts) => {
        const newContactElements: (string | AddressBookEntry)[] = [];
        const addressBookTree: Record<string, AddressBookEntry[]> = {};

        updatedContacts.forEach((contact) => {
          const contactNameInitial = contact?.name?.[0];
          const nameInitial = regex.nameInitial.exec(contactNameInitial);
          const initial = nameInitial
            ? nameInitial[0].toLowerCase()
            : strings('address_book.others');
          if (Object.keys(addressBookTree).includes(initial)) {
            addressBookTree[initial].push(contact);
          } else if (contact.isSmartContract && !onlyRenderAddressBook) {
            return;
          } else {
            addressBookTree[initial] = [contact];
          }
        });

        Object.keys(addressBookTree)
          .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
          .forEach((initial) => {
            newContactElements.push(initial);
            addressBookTree[initial].forEach((contact: AddressBookEntry) => {
              newContactElements.push(contact);
            });
          });

        setContactElements(newContactElements);
      });
    },
    [onlyRenderAddressBook, ambiguousAddressEntries, chainId],
  );

  useEffect(() => {
    const networkAddressBookList = Object.keys(networkAddressBook).map(
      (address) => networkAddressBook[address],
    );
    const newFuse = new Fuse(networkAddressBookList, {
      shouldSort: true,
      threshold: 0.45,
      location: 0,
      distance: 10,
      maxPatternLength: 32,
      minMatchCharLength: 1,
      keys: [
        { name: 'name', weight: 0.5 },
        { name: 'address', weight: 0.5 },
      ],
    });
    setFuse(newFuse);
    parseAddressBook(networkAddressBookList);
  }, [networkAddressBook, parseAddressBook]);

  const getNetworkAddressBookList = useCallback((): AddressBookEntry[] => {
    if (inputSearch && fuse) {
      return fuse.search(inputSearch);
    }

    return Object.keys(networkAddressBook).map(
      (address) => networkAddressBook[address],
    );
  }, [fuse, inputSearch, networkAddressBook]);

  useEffect(() => {
    const networkAddressBookList = getNetworkAddressBookList();
    parseAddressBook(networkAddressBookList);
  }, [
    inputSearch,
    addressBook,
    chainId,
    reloadAddressList,
    getNetworkAddressBookList,
    parseAddressBook,
  ]);

  const renderMyAccounts = () => {
    if (inputSearch) return null;

    return (
      <View style={styles.yourContactcWrapper}>
        <Text
          variant={TextVariant.BodyLGMedium}
          style={styles.labelElementText}
        >
          {strings('onboarding_wizard.step2.title')}
        </Text>
        {internalAccounts.map((account) => (
          <AddressElement
            key={account.id}
            address={toChecksumHexAddress(account.address)}
            name={account.metadata.name}
            onAccountPress={onAccountPress}
            onIconPress={onIconPress}
            onAccountLongPress={onAccountLongPress}
            testID={SendViewSelectorsIDs.MY_ACCOUNT_ELEMENT}
            chainId={chainId}
          />
        ))}
      </View>
    );
  };

  const renderElement = (addressElement: string | AddressBookEntry) => {
    if (typeof addressElement === 'string') {
      return LabelElement(styles, addressElement);
    }

    const key = addressElement.address + addressElement.name;

    return (
      <AddressElement
        key={key}
        address={addressElement.address}
        name={addressElement.name}
        onIconPress={onIconPress}
        onAccountPress={onAccountPress}
        onAccountLongPress={onAccountLongPress}
        testID={SendViewSelectorsIDs.ADDRESS_BOOK_ACCOUNT}
        isAmbiguousAddress={addressElement.isAmbiguousAddress}
        chainId={chainId}
      />
    );
  };

  const renderContent = () => {
    const sendFlowContacts: (string | AddressBookEntry)[] = [];

    contactElements.forEach((contractElement) => {
      if (
        typeof contractElement === 'object' &&
        contractElement.isSmartContract === false
      ) {
        const nameInitial = contractElement?.name?.[0].toLowerCase();
        if (sendFlowContacts.includes(nameInitial)) {
          sendFlowContacts.push(contractElement);
        } else {
          sendFlowContacts.push(nameInitial);
          sendFlowContacts.push(contractElement);
        }
      }
    });

    return (
      <View style={styles.root}>
        <KeyboardAwareScrollView
          style={styles.myAccountsWrapper}
          keyboardShouldPersistTaps="handled"
        >
          {!onlyRenderAddressBook ? (
            <>
              {renderMyAccounts()}

              {sendFlowContacts.length ? (
                <Text
                  variant={TextVariant.BodyLGMedium}
                  style={styles.labelElementText}
                >
                  {strings('app_settings.contacts_title')}
                </Text>
              ) : (
                <></>
              )}

              {sendFlowContacts.map(renderElement)}
            </>
          ) : (
            contactElements.map(renderElement)
          )}
        </KeyboardAwareScrollView>
      </View>
    );
  };

  return renderContent();
};

export default AddressList;
