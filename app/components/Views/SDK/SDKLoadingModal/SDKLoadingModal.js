// Third party dependencies.
import React, { useRef } from 'react';

// External dependencies
import SDKLoading from '../../../UI/SDKLoading';
import BottomSheet from

'../../../../component-library/components/BottomSheets/BottomSheet';

const SDKLoadingModal = () => {
  const sheetRef = useRef(null);

  return (
    <BottomSheet ref={sheetRef}>
      <SDKLoading />
    </BottomSheet>);

};

export default SDKLoadingModal;