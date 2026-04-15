import React, { useState } from 'react';
import { TouchableOpacity, View } from 'react-native';

import ButtonIcon, {
  ButtonIconSizes } from
'../../../../../../component-library/components/Buttons/ButtonIcon';
import {
  IconColor,
  IconName } from
'../../../../../../component-library/components/Icons/Icon';
import Text from '../../../../../../component-library/components/Texts/Text';
import { useStyles } from '../../../../../../component-library/hooks';
import BottomModal from '../bottom-modal';
import styleSheet from './expandable.styles';










export let IconVerticalPosition = /*#__PURE__*/function (IconVerticalPosition) {IconVerticalPosition["Top"] = "top";return IconVerticalPosition;}({});



const Expandable = ({
  collapsedContent,
  expandedContent,
  expandedContentTitle,
  collapseButtonTestID,
  testID,
  isCompact
}) => {
  const { styles } = useStyles(styleSheet, { isCompact });
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <TouchableOpacity
        onPress={() => setExpanded(true)}
        onPressIn={() => setExpanded(true)}
        onPressOut={() => setExpanded(true)}
        accessible
        activeOpacity={1}
        testID={testID ?? 'expandableSection'}>
        
        {collapsedContent}
      </TouchableOpacity>
      {expanded &&
      <BottomModal onClose={() => setExpanded(false)}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ButtonIcon
              iconColor={IconColor.Default}
              size={ButtonIconSizes.Sm}
              onPress={() => setExpanded(false)}
              iconName={IconName.ArrowLeft}
              testID={collapseButtonTestID ?? 'collapseButtonTestID'} />
            
              <Text style={styles.expandedContentTitle}>
                {expandedContentTitle}
              </Text>
            </View>
            {expandedContent}
          </View>
        </BottomModal>
      }
    </>);

};

export default Expandable;