import React from 'react';


import { ConfirmationPageSectionsSelectorIDs } from '../../../../../../../e2e/selectors/Confirmation/ConfirmationView.selectors';
import { strings } from '../../../../../../../locales/i18n';
import useApprovalRequest from '../../../hooks/useApprovalRequest';
import { getSIWEDetails } from '../../../utils/signature';
import { useSignatureRequest } from '../../../hooks/signatures/useSignatureRequest';
import Address from '../../UI/info-row/info-value/address';
import DisplayURL from '../../UI/info-row/info-value/display-url';
import InfoRow from '../../UI/info-row';
import InfoSection from '../../UI/info-row/info-section';
import AlertRow from '../../UI/info-row/alert-row';
import { RowAlertKey } from '../../UI/info-row/alert-row/constants';
import { useTransactionMetadataRequest } from '../../../hooks/transactions/useTransactionMetadataRequest';

const InfoRowOrigin = ({
  isSignatureRequest


}) => {
  const signatureRequest = useSignatureRequest();
  const transactionMetadata = useTransactionMetadataRequest();
  const { approvalRequest } = useApprovalRequest();
  let chainId;
  let fromAddress;
  let isSIWEMessage;
  let url;
  if (isSignatureRequest) {
    if (!signatureRequest || !approvalRequest) return null;

    chainId = signatureRequest?.chainId;
    isSIWEMessage = getSIWEDetails(signatureRequest).isSIWEMessage;
    fromAddress = signatureRequest?.messageParams?.from;
    url = approvalRequest?.requestData?.meta?.url;
  } else {
    if (!transactionMetadata) return null;

    chainId = transactionMetadata?.chainId;
    fromAddress = transactionMetadata?.txParams?.from;
    url = transactionMetadata?.origin;
  }

  return (
    <InfoSection
      testID={ConfirmationPageSectionsSelectorIDs.ORIGIN_INFO_SECTION}>
      
      <AlertRow
        alertField={RowAlertKey.RequestFrom}
        label={strings('confirm.label.request_from')}
        tooltip={strings(
          isSignatureRequest ?
          'confirm.personal_sign_tooltip' :
          'confirm.transaction_tooltip'
        )}>
        
        <DisplayURL url={url ?? ''} />
      </AlertRow>
      {isSignatureRequest && isSIWEMessage &&
      <InfoRow
        label={strings('confirm.label.signing_in_with')}
        testID={
        ConfirmationPageSectionsSelectorIDs.SIWE_SIGNING_ACCOUNT_INFO_SECTION
        }>
        
          <Address address={fromAddress} chainId={chainId} />
        </InfoRow>
      }
    </InfoSection>);

};

export default InfoRowOrigin;