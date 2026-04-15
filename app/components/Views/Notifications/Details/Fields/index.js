import React from 'react';

import AddressField from './AddressField';
import AnnouncementDescriptionField from './AnnouncementDescriptionField';
import AssetField from './AssetField';
import NetworkFeeField from './NetworkFeeField';
import NetworkField from './NetworkField';
import NFTCollectionField from './NFTCollectionField';
import StakingProviderField from './StakingProviderField';
import SwapsRateField from './SwapsRateField';
import TransactionField from './TransactionField';


















export default function ModalField({
  modalField,
  isCollapsed,
  setIsCollapsed,
  notification
}) {
  if (modalField.type === 'ModalField-AnnouncementDescription')
  return <AnnouncementDescriptionField {...modalField} />;

  if (modalField.type === 'ModalField-Address')
  return <AddressField {...modalField} />;

  if (modalField.type === 'ModalField-Asset')
  return <AssetField {...modalField} />;

  if (modalField.type === 'ModalField-NFTCollectionImage')
  return <NFTCollectionField {...modalField} />;

  if (modalField.type === 'ModalField-Network')
  return <NetworkField {...modalField} />;

  if (modalField.type === 'ModalField-NetworkFee')
  return (
    <NetworkFeeField
      {...modalField}
      isCollapsed={isCollapsed}
      setIsCollapsed={setIsCollapsed}
      notification={notification} />);



  if (modalField.type === 'ModalField-StakingProvider')
  return <StakingProviderField {...modalField} />;

  if (modalField.type === 'ModalField-SwapsRate')
  return <SwapsRateField {...modalField} />;

  if (modalField.type === 'ModalField-Transaction')
  return <TransactionField {...modalField} notification={notification} />;

  return null;
}