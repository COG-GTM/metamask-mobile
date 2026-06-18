/* eslint-disable react/prop-types */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { useSelector } from 'react-redux';
import Fuse from 'fuse.js';
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

// TODO: Replace "any" with type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const LabelElement = (styles: Record<string, any>, label: string) => (
  <View key={label} style={styles.labelElementWrapper}>
    <Text variant={TextVariant.BodyMD} style={styles.contactLabel}>
      {label.toUpperCase()}
    </Text>
  </View>
);

interface AddressListProps {
  chainId: string;
  inputSearch?: string;
  onAccountPress: (address: string) => void;
  onAccountLongPress?: (address: string) => void;
  onIconPress?: (address: string) => void;
  onlyRenderAddressBook?: boolean;
  reloadAddressList?: unknown;
}

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
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [contactElements, setContactElements] = useState<any[]>([]);
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [fuse, setFuse] = useState<any>(undefined);
  const internalAccounts = useSelector(selectInternalAccounts);
  const addressBook = useSelector(selectAddressBook);
  const ambiguousAddressEntries = useSelector(
    // TODO: Replace "any" with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (state: any) => state.user.ambiguousAddressEntries,
  );

  const networkAddressBook = useMemo(
    // @ts-expect-error Legacy JS migration - TS7053
    () => addressBook[chainId] || {},
    [addressBook, chainId],
  );
  const parseAddressBook = useCallback(
    // TODO: Replace "any" with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (networkAddressBookList: any[]) => {
      const contacts = networkAddressBookList.map((contact) => {
        const isAmbiguousAddress =
          chainId &&
          ambiguousAddressEntries?.[chainId]?.includes(contact.address);
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
        // @ts-expect-error Legacy JS migration - TS7034
        const newContactElements = [];
        const addressBookTree = {};

        updatedContacts.forEach((contact) => {
          const contactNameInitial = contact?.name?.[0];
          const nameInitial = regex.nameInitial.exec(contactNameInitial);
          const initial = nameInitial
            ? nameInitial[0].toLowerCase()
            : strings('address_book.others');
          if (Object.keys(addressBookTree).includes(initial)) {
            // @ts-expect-error Legacy JS migration - TS7053
            addressBookTree[initial].push(contact);
          } else if (contact.isSmartContract && !onlyRenderAddressBook) {
            return;
          } else {
            // @ts-expect-error Legacy JS migration - TS7053
            addressBookTree[initial] = [contact];
          }
        });

        Object.keys(addressBookTree)
          .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
          .forEach((initial) => {
            newContactElements.push(initial);
            // @ts-expect-error Legacy JS migration - TS7053
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            addressBookTree[initial].forEach((contact: any) => {
              newContactElements.push(contact);
            });
          });

        // @ts-expect-error Legacy JS migration - TS7005
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

  const getNetworkAddressBookList = useCallback(() => {
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
            // @ts-expect-error Legacy JS migration - TS2322
            onIconPress={onIconPress}
            // @ts-expect-error Legacy JS migration - TS2322
            onAccountLongPress={onAccountLongPress}
            testID={SendViewSelectorsIDs.MY_ACCOUNT_ELEMENT}
            // @ts-expect-error Legacy JS migration - TS2322
            chainId={chainId}
          />
        ))}
      </View>
    );
  };

  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderElement = (addressElement: any) => {
    if (typeof addressElement === 'string') {
      return LabelElement(styles, addressElement);
    }

    const key = addressElement.address + addressElement.name;

    return (
      <AddressElement
        key={key}
        address={addressElement.address}
        name={addressElement.name}
        // @ts-expect-error Legacy JS migration - TS2322
        onIconPress={onIconPress}
        onAccountPress={onAccountPress}
        // @ts-expect-error Legacy JS migration - TS2322
        onAccountLongPress={onAccountLongPress}
        testID={SendViewSelectorsIDs.ADDRESS_BOOK_ACCOUNT}
        isAmbiguousAddress={addressElement.isAmbiguousAddress}
        // @ts-expect-error Legacy JS migration - TS2322
        chainId={chainId}
      />
    );
  };

  const renderContent = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sendFlowContacts: any[] = [];

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
