import { useNavigation } from '@react-navigation/native';

import { useEffect } from 'react';
import { useTheme } from '../../../../../util/theme';

import { getNavbar } from '../../components/UI/navbar/navbar';
import { useConfirmActions } from '../useConfirmActions';

const useNavbar = (title, addBackButton = true) => {
  const navigation =
  useNavigation();
  const { onReject } = useConfirmActions();
  const theme = useTheme();

  useEffect(() => {
    navigation.setOptions(
      getNavbar({
        title,
        onReject,
        addBackButton,
        theme
      })
    );
  }, [navigation, onReject, theme, title, addBackButton]);
};

export default useNavbar;