/* eslint-disable react/prop-types */
import React, { useEffect, useMemo, useRef, useState } from 'react';
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

const LabelElement = (styles, label) => (
  <View key={label} style={styles.labelElementWrapper}>
    <Text variant={TextVariant.BodyMD} style={styles.contactLabel}>
      {label.toUpperCase()}
    </Text>
  </View>
);

// A failed lookup renders the contact as a regular account but is retried the
// next time the address book, chain or reloadAddressList changes.
const LOOKUP_FAILED = null;

const getContractStatusKey = (contact, fallbackChainId) =>
  `${contact.chainId ?? fallbackChainId}:${contact.address?.toLowerCase()}`;

const AddressList = ({
  chainId,
  inputSearch,
  onAccountPress,
  onAccountLongPress,
  onIconPress,
  onlyRenderAddressBook = false,
  reloadAddressList,
}) => {
  const { colors } = useTheme();
  const styles = styleSheet(colors);
  const [smartContractStatus, setSmartContractStatus] = useState({});
  const inFlightLookups = useRef(new Set());
  const isMounted = useRef(true);
  const internalAccounts = useSelector(selectInternalAccounts);
  const addressBook = useSelector(selectAddressBook);
  const ambiguousAddressEntries = useSelector(
    (state) => state.user.ambiguousAddressEntries,
  );

  const networkAddressBook = useMemo(
    () => addressBook[chainId] || {},
    [addressBook, chainId],
  );

  const networkAddressBookList = useMemo(
    () =>
      Object.keys(networkAddressBook).map(
        (address) => networkAddressBook[address],
      ),
    // reloadAddressList lets parent screens force a fresh list snapshot
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [networkAddressBook, reloadAddressList],
  );

  const fuse = useMemo(
    () =>
      new Fuse(networkAddressBookList, {
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
      }),
    [networkAddressBookList],
  );

  useEffect(
    () => () => {
      isMounted.current = false;
    },
    [],
  );

  // Contract status per (chainId, address) is resolved once for the whole
  // network address book; searching only filters the cached results. Results
  // are keyed by chain and address, so a lookup that finishes after the chain
  // or list changed can still be stored without affecting the rendered list.
  useEffect(() => {
    networkAddressBookList.forEach((contact) => {
      const key = getContractStatusKey(contact, chainId);
      if (
        smartContractStatus[key] != null ||
        inFlightLookups.current.has(key)
      ) {
        return;
      }
      inFlightLookups.current.add(key);
      isSmartContractAddress(contact.address, contact.chainId ?? chainId)
        .then((isSmartContract) => Boolean(isSmartContract))
        .catch(() => LOOKUP_FAILED)
        .then((status) => {
          inFlightLookups.current.delete(key);
          if (!isMounted.current) return;
          setSmartContractStatus((prevStatus) => ({
            ...prevStatus,
            [key]: status,
          }));
        });
    });
    // smartContractStatus is intentionally omitted: storing results must not
    // re-trigger lookups, and pending addresses are recomputed when the
    // address book, chain or reloadAddressList changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [networkAddressBookList, chainId]);

  const isContractStatusResolved = useMemo(
    () =>
      networkAddressBookList.every(
        (contact) =>
          smartContractStatus[getContractStatusKey(contact, chainId)] !==
          undefined,
      ),
    [networkAddressBookList, smartContractStatus, chainId],
  );

  const contactElements = useMemo(() => {
    if (!isContractStatusResolved) return [];

    const filteredContacts = inputSearch
      ? fuse.search(inputSearch)
      : networkAddressBookList;

    const newContactElements = [];
    const addressBookTree = {};

    filteredContacts.forEach((addressBookContact) => {
      const isAmbiguousAddress =
        chainId &&
        ambiguousAddressEntries?.[chainId]?.includes(
          addressBookContact.address,
        );
      const contact = {
        ...addressBookContact,
        ...(isAmbiguousAddress && { isAmbiguousAddress }),
        isSmartContract:
          smartContractStatus[
            getContractStatusKey(addressBookContact, chainId)
          ] === true,
      };

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
        addressBookTree[initial].forEach((contact) => {
          newContactElements.push(contact);
        });
      });

    return newContactElements;
  }, [
    isContractStatusResolved,
    inputSearch,
    fuse,
    networkAddressBookList,
    chainId,
    ambiguousAddressEntries,
    smartContractStatus,
    onlyRenderAddressBook,
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
    const sendFlowContacts = [];

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
