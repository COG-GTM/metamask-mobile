// Third party dependencies
import React, { useRef } from 'react';

// External dependencies
import BottomSheet from

'../../../component-library/components/BottomSheets/BottomSheet';
import SheetHeader from '../../../component-library/components/Sheet/SheetHeader/SheetHeader';
import Text from '../../../component-library/components/Texts/Text/Text';
import { strings } from '../../../../locales/i18n';

// Internal dependencies
import createStyles from './ShowTokenIdSheet.styles';
import { useParams } from '../../../util/navigation/navUtils';

import { View } from 'react-native';

const ShowTokenIdSheet = () => {
  const styles = createStyles();
  const sheetRef = useRef(null);
  const { tokenId } = useParams();

  return (
    <BottomSheet ref={sheetRef}>
      <SheetHeader
        style={styles.header}
        title={strings('nft_details.token_id')} />
      
      <View style={styles.textContent}>
        <Text>{tokenId}</Text>
      </View>
    </BottomSheet>);

};

export default ShowTokenIdSheet;