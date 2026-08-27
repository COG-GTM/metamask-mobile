/* eslint-disable react/prop-types, @typescript-eslint/no-unused-vars, @typescript-eslint/no-shadow, @typescript-eslint/prefer-optional-chain, @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires, @typescript-eslint/prefer-for-of, @typescript-eslint/no-explicit-any, import/no-namespace, import/no-named-as-default-member, react/no-unstable-nested-components */
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

// @ts-expect-error -- legacy JavaScript UI type boundary
const LabelElement = (styles, label): any => (
  <View key={label} style={styles.labelElementWrapper}>
    <Text variant={TextVariant.BodyMD} style={styles.contactLabel}>
      {label.toUpperCase()}
    </Text>
  </View>
);

const AddressList = ({
  // @ts-expect-error -- legacy JavaScript UI type boundary
  chainId,
  // @ts-expect-error -- legacy JavaScript UI type boundary
  inputSearch,
  // @ts-expect-error -- legacy JavaScript UI type boundary
  onAccountPress,
  // @ts-expect-error -- legacy JavaScript UI type boundary
  onAccountLongPress,
  // @ts-expect-error -- legacy JavaScript UI type boundary
  onIconPress,
  onlyRenderAddressBook = false,
  // @ts-expect-error -- legacy JavaScript UI type boundary
  reloadAddressList,
// @ts-expect-error -- legacy JavaScript UI type boundary
}): Props => {
  const { colors } = useTheme();
  const styles = styleSheet(colors);
  const [contactElements, setContactElements] = useState([]);
  const [fuse, setFuse] = useState(undefined);
  const internalAccounts = useSelector(selectInternalAccounts);
  const addressBook = useSelector(selectAddressBook);
  const ambiguousAddressEntries = useSelector(
    // @ts-expect-error -- legacy JavaScript UI type boundary
    (state) => state.user.ambiguousAddressEntries,
  );

  const networkAddressBook = useMemo(
    () => addressBook[chainId] || {},
    [addressBook, chainId],
  );
  const parseAddressBook = useCallback(
    // @ts-expect-error -- legacy JavaScript UI type boundary
    (networkAddressBookList) => {
      // @ts-expect-error -- legacy JavaScript UI type boundary
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
        // @ts-expect-error -- legacy JavaScript UI type boundary
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
        // @ts-expect-error -- legacy JavaScript UI type boundary
        const newContactElements = [];
        const addressBookTree = {};

        updatedContacts.forEach((contact) => {
          const contactNameInitial = contact?.name?.[0];
          const nameInitial = regex.nameInitial.exec(contactNameInitial);
          const initial = nameInitial
            ? nameInitial[0].toLowerCase()
            : strings('address_book.others');
          if (Object.keys(addressBookTree).includes(initial)) {
            // @ts-expect-error -- legacy JavaScript UI type boundary
            addressBookTree[initial].push(contact);
          } else if (contact.isSmartContract && !onlyRenderAddressBook) {
            return;
          } else {
            // @ts-expect-error -- legacy JavaScript UI type boundary
            addressBookTree[initial] = [contact];
          }
        });

        Object.keys(addressBookTree)
          .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
          .forEach((initial) => {
            newContactElements.push(initial);
            // @ts-expect-error -- legacy JavaScript UI type boundary
            addressBookTree[initial].forEach((contact) => {
              newContactElements.push(contact);
            });
          });

        // @ts-expect-error -- legacy JavaScript UI type boundary
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
    // @ts-expect-error -- legacy JavaScript UI type boundary
    setFuse(newFuse);
    parseAddressBook(networkAddressBookList);
  }, [networkAddressBook, parseAddressBook]);

  const getNetworkAddressBookList = useCallback(() => {
    if (inputSearch && fuse) {
      // @ts-expect-error -- legacy JavaScript UI type boundary
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

  // @ts-expect-error -- legacy JavaScript UI type boundary
  const renderElement = (addressElement) => {
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
    // @ts-expect-error -- legacy JavaScript UI type boundary
    const sendFlowContacts = [];

    contactElements.forEach((contractElement) => {
      if (
        typeof contractElement === 'object' &&
        // @ts-expect-error -- legacy JavaScript UI type boundary
        contractElement.isSmartContract === false
      ) {
        // @ts-expect-error -- legacy JavaScript UI type boundary
        const nameInitial = contractElement?.name?.[0].toLowerCase();
        // @ts-expect-error -- legacy JavaScript UI type boundary
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

              {/* @ts-expect-error -- legacy JavaScript UI type boundary */}
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
