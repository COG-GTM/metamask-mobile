import React from 'react';
import SignatureMessageSection from '../../signature-message-section';
import DataTree from '../../data-tree/data-tree';
import { useSignatureRequest } from '../../../hooks/signatures/useSignatureRequest';







const Message = () => {
  const signatureRequest = useSignatureRequest();
  const chainId = signatureRequest?.chainId;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const typedSignData = signatureRequest?.messageParams?.data;

  if (!typedSignData) {
    return null;
  }

  const parsedData = typedSignData.reduce(
    (val, { name, value, type }) => ({
      ...val,
      [name]: { type, value }
    }),
    {}
  );

  const firstDataValue = typedSignData[0];

  return (
    <SignatureMessageSection
      messageCollapsed={
      <DataTree
        data={{
          [firstDataValue.name]: {
            type: firstDataValue.type,
            value: firstDataValue.value
          }
        }}
        chainId={chainId} />

      }
      messageExpanded={<DataTree data={parsedData} chainId={chainId} />}
      copyMessageText={typedSignData} />);


};

export default Message;