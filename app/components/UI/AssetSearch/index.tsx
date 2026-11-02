import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import {
  TextInput,
  View,
  StyleSheet,
  TextStyle,
  DimensionValue,
} from 'react-native';
import { Hex } from '@metamask/utils';
import { fontStyles } from '../../../styles/common';
import { strings } from '../../../../locales/i18n';
import Fuse from 'fuse.js';
import { debounce } from 'lodash';
import { useSelector } from 'react-redux';
import { TokenListToken } from '@metamask/assets-controllers';
import { useTheme } from '../../../util/theme';
import { ImportTokenViewSelectorsIDs } from '../../../../e2e/selectors/wallet/ImportTokenView.selectors';
import { selectERC20TokensByChain } from '../../../selectors/tokenListController';
import Icon, {
  IconName,
  IconSize,
} from '../../../component-library/components/Icons/Icon';
import ButtonIcon, {
  ButtonIconSizes,
} from '../../../component-library/components/Buttons/ButtonIcon';
import { selectChainId } from '../../../selectors/networkController';

// TODO: Replace "any" with type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createStyles = (colors: any) =>
  StyleSheet.create({
    searchSection: {
      margin: 16,
      marginBottom: 0,
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderRadius: 8,
      borderColor: colors.border.default,
      color: colors.text.default,
    },
    searchSectionFocused: {
      margin: 16,
      marginBottom: 0,
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 8,
      color: colors.text.default,
      borderColor: colors.primary.default,
      borderWidth: 2,
    },
    textInput: {
      ...fontStyles.normal,
      color: colors.text.default,
    } as TextStyle,
    icon: {
      paddingLeft: 20,
      color: colors.icon.alternative,
    },
    iconClose: {
      paddingRight: 20,
      color: colors.icon.alternative,
    },
    input: {
      width: '80%',
      paddingHorizontal: 12,
      paddingVertical: 12,
      color: colors.icon.alternative,
      borderColor: colors.primary.alternative,
    },
  });

export const SEARCH_DEBOUNCE_MS = 250;

const ADDRESS_REGEX = /^0x[0-9a-f]{40}$/i;

const fuse = new Fuse<TokenListToken>([], {
  shouldSort: true,
  threshold: 0.45,
  location: 0,
  distance: 100,
  maxPatternLength: 32,
  minMatchCharLength: 1,
  keys: [
    { name: 'name', weight: 0.5 },
    { name: 'symbol', weight: 0.5 },
  ],
});

interface Props {
  onSearch: ({
    results,
    searchQuery,
  }: {
    results: TokenListToken[];
    searchQuery: string;
  }) => void;
  /**
   * Callback that is called when the text input is focused
   */
  onFocus: () => void;
  /**
   * Callback that is called when the text input is blurred
   */
  onBlur: () => void;

  /**
   * Whether all networks are enabled
   */
  allNetworksEnabled: boolean;
}

// eslint-disable-next-line react/display-name
const AssetSearch = ({
  onSearch,
  onFocus,
  onBlur,
  allNetworksEnabled,
}: Props) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [inputDimensions, setInputDimensions] = useState<DimensionValue>('85%');
  const [isFocus, setIsFocus] = useState(false);
  const chainId = useSelector(selectChainId);
  const tokenListForAllChains = useSelector(selectERC20TokensByChain);
  const { colors, themeAppearance } = useTheme();
  const styles = createStyles(colors);

  const tokenList = useMemo(() => {
    if (allNetworksEnabled) {
      return Object.entries(tokenListForAllChains).flatMap(
        ([networkId, { data }]) =>
          Object.values(data).map((item) => ({
            ...item,
            chainId: networkId,
          })),
      );
    }

    return Object.values(
      tokenListForAllChains?.[chainId as Hex]?.data ?? [],
    ).map((item) => ({
      ...item,
      chainId: chainId as Hex,
    }));
  }, [allNetworksEnabled, tokenListForAllChains, chainId]);

  const tokensByAddress = useMemo(() => {
    const index = new Map<string, TokenListToken[]>();
    tokenList.forEach((token) => {
      const key = token.address?.toLowerCase();
      if (!key) return;
      const tokens = index.get(key);
      if (tokens) {
        tokens.push(token);
      } else {
        index.set(key, [token]);
      }
    });
    return index;
  }, [tokenList]);

  useEffect(() => {
    setTimeout(() => {
      setInputDimensions('86%');
    }, 100);
  }, []);

  // Update fuse list
  useEffect(() => {
    if (Array.isArray(tokenList)) {
      fuse.setCollection(tokenList);
    }
  }, [tokenList]);

  const runSearch = useCallback(
    (searchText: string) => {
      const query = searchText.trim();
      const results = ADDRESS_REGEX.test(query)
        ? tokensByAddress.get(query.toLowerCase()) ?? []
        : fuse.search(searchText);
      onSearch({ searchQuery: searchText, results });
    },
    [onSearch, tokensByAddress],
  );

  const runSearchRef = useRef(runSearch);
  runSearchRef.current = runSearch;

  const debouncedSearch = useMemo(
    () =>
      debounce(
        (searchText: string) => runSearchRef.current(searchText),
        SEARCH_DEBOUNCE_MS,
      ),
    [],
  );

  useEffect(() => () => debouncedSearch.cancel(), [debouncedSearch]);

  const handleSearch = useCallback(
    (searchText: string) => {
      setSearchQuery(searchText);
      if (!searchText.trim()) {
        debouncedSearch.cancel();
        onSearch({ searchQuery: searchText, results: [] });
        return;
      }
      debouncedSearch(searchText);
    },
    [debouncedSearch, onSearch],
  );

  useEffect(() => {
    setSearchQuery('');
    handleSearch('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allNetworksEnabled]);

  return (
    <View
      style={[isFocus ? styles.searchSectionFocused : styles.searchSection]}
      testID={ImportTokenViewSelectorsIDs.ASSET_SEARCH_CONTAINER}
    >
      <View style={styles.icon}>
        <Icon name={IconName.Search} size={IconSize.Sm} />
      </View>

      <View style={styles.input}>
        <TextInput
          style={[
            styles.textInput,
            { height: inputDimensions, width: inputDimensions },
          ]}
          value={searchQuery}
          onFocus={() => {
            onFocus();
            setIsFocus(true);
          }}
          onBlur={() => {
            onBlur();
            setIsFocus(false);
          }}
          placeholder={strings('token.search_tokens_placeholder')}
          placeholderTextColor={colors.text.muted}
          onChangeText={handleSearch}
          testID={ImportTokenViewSelectorsIDs.SEARCH_BAR}
          keyboardAppearance={themeAppearance}
        />
      </View>

      <View style={styles.iconClose}>
        <ButtonIcon
          size={ButtonIconSizes.Sm}
          iconName={IconName.Close}
          onPress={() => {
            setSearchQuery('');
            handleSearch('');
          }}
          testID={ImportTokenViewSelectorsIDs.CLEAR_SEARCH_BAR}
        />
      </View>
    </View>
  );
};

export default AssetSearch;
