import { useDispatch } from 'react-redux';
import { strings } from '../../../../../../locales/i18n';
import { showAlert } from '../../../../../actions/alert';
import { protectWalletModalVisible } from '../../../../../actions/user';
import ClipboardManager from '../../../../../core/ClipboardManager';

export const CopyClipboardAlertMessage = {
  default: () => strings('notifications.copied_to_clipboard'),
  address: () => strings('notifications.address_copied_to_clipboard'),
  transaction: () =>
  strings('notifications.transaction_id_copied_to_clipboard')
};

function useCopyClipboard() {
  const dispatch = useDispatch();

  const handleShowAlert = (config) =>




  dispatch(showAlert(config));

  const handleProtectWalletModalVisible = () =>
  dispatch(protectWalletModalVisible());

  const copyToClipboard = async (value, alertText) => {
    if (!value) return;
    await ClipboardManager.setString(value);
    handleShowAlert({
      isVisible: true,
      autodismiss: 1500,
      content: 'clipboard-alert',
      data: {
        msg: alertText ?? CopyClipboardAlertMessage.default()
      }
    });
    setTimeout(() => handleProtectWalletModalVisible(), 2000);
  };

  return copyToClipboard;
}

export default useCopyClipboard;