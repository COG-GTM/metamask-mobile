import React, { useEffect, useRef } from 'react';
import { Hex } from '@metamask/utils';
import { ActivityIndicator, Text, View } from 'react-native';
import { StackActions, useNavigation } from '@react-navigation/native';
import Routes from '../../../constants/navigation/Routes';
import Engine from '../../../core/Engine';
import { useSelector } from 'react-redux';
import { RootState } from '../../../reducers';
import { selectTokenDisplayData } from '../../../selectors/tokenSearchDiscoveryDataController';
import { selectCurrentCurrency } from '../../../selectors/currencyRateController';
import { useStyles } from '../../../component-library/hooks';
import styleSheet from './styles';

export interface AssetLoaderProps {
    route: {
        params: {
            address: string;
            chainId: Hex;
        }
    }
}

export const AssetLoader: React.FC<AssetLoaderProps> = ({ route: { params: { address, chainId } } }) => {
    const tokenResult = useSelector((state: RootState) => selectTokenDisplayData(state, chainId, address));
    const currentCurrency = useSelector(selectCurrentCurrency);
    const navigation = useNavigation();

    const { styles } = useStyles(styleSheet, {});

    const hasTokenResultRef = useRef(Boolean(tokenResult));
    hasTokenResultRef.current = Boolean(tokenResult);

    useEffect(() => {
        if (hasTokenResultRef.current) {
            return;
        }
        Engine.context.TokenSearchDiscoveryDataController.fetchTokenDisplayData(chainId, address);
    }, [address, chainId, currentCurrency]);

    useEffect(() => {
        if (tokenResult?.found) {
            navigation.dispatch(
                StackActions.replace(Routes.BROWSER.ASSET_VIEW, {
                    ...tokenResult.token,
                    chainId,
                    isFromSearch: true,
                })
            );
        }
    }, [tokenResult, chainId, navigation]);

    if (tokenResult && !tokenResult.found) {
        return (
            <View style={styles.container}>
                <Text>Token not found</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ActivityIndicator testID="asset-loader-spinner" size="large" />
        </View>
    );
};
