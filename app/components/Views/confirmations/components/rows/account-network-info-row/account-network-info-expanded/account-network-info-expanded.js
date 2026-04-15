import React from 'react';
import { View } from 'react-native';

import { strings } from '../../../../../../../../locales/i18n';
import useAccountInfo from '../../../../hooks/useAccountInfo';
import InfoSection from '../../../UI/info-row/info-section';
import InfoRow from '../../../UI/info-row';
import Network from '../../../UI/info-row/info-value/network';
import { useSignatureRequest } from '../../../../hooks/signatures/useSignatureRequest';

import { renderShortAddress } from '../../../../../../../util/address';
import { useSelectedAccountMultichainBalances } from '../../../../../../hooks/useMultichainBalances';
import { useTransactionMetadataRequest } from '../../../../hooks/transactions/useTransactionMetadataRequest';

const AccountNetworkInfoExpanded = () => {
  const signatureRequest = useSignatureRequest();
  const transactionMetadata = useTransactionMetadataRequest();

  let chainId;
  let fromAddress;
  if (signatureRequest) {
    chainId = signatureRequest?.chainId;
    fromAddress = signatureRequest?.messageParams?.from;
  } else {
    chainId = transactionMetadata?.chainId;
    fromAddress = transactionMetadata?.txParams?.from;
  }
  const { accountAddress } = useAccountInfo(fromAddress);
  const { selectedAccountMultichainBalance } =
  useSelectedAccountMultichainBalances();
  const balanceToDisplay = selectedAccountMultichainBalance?.displayBalance;

  return (
    <View>
      <InfoSection>
        <InfoRow label={strings('confirm.label.account')}>
          {renderShortAddress(accountAddress, 5)}
        </InfoRow>
        <InfoRow label={strings('confirm.label.balance')}>
          {balanceToDisplay}
        </InfoRow>
      </InfoSection>
      <InfoSection>
        <InfoRow label={strings('confirm.label.network')}>
          <Network chainId={chainId} />
        </InfoRow>
      </InfoSection>
    </View>);

};

export default AccountNetworkInfoExpanded;