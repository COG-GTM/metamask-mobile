import { act } from '@testing-library/react-hooks';
import useCopyClipboard, {
  CopyClipboardAlertMessage,
} from './useCopyClipboard';
import { renderHookWithProvider } from '../../../../../util/test/renderWithProvider';
import ClipboardManager from '../../../../../core/ClipboardManager';
import { showAlert } from '../../../../../actions/alert';
import { protectWalletModalVisible } from '../../../../../actions/user';

jest.mock('../../../../../../locales/i18n', () => ({
  strings: jest.fn((key: string) => key),
}));

jest.mock('../../../../../core/ClipboardManager', () => ({
  __esModule: true,
  default: {
    setString: jest.fn(),
  },
}));

jest.mock('../../../../../actions/alert', () => ({
  showAlert: jest.fn((payload) => ({ type: 'SHOW_ALERT', payload })),
}));

jest.mock('../../../../../actions/user', () => ({
  protectWalletModalVisible: jest.fn(() => ({
    type: 'PROTECT_WALLET_MODAL_VISIBLE',
  })),
}));

describe('CopyClipboardAlertMessage', () => {
  it('returns i18n keys for default, address and transaction messages', () => {
    expect(CopyClipboardAlertMessage.default()).toBe(
      'notifications.copied_to_clipboard',
    );
    expect(CopyClipboardAlertMessage.address()).toBe(
      'notifications.address_copied_to_clipboard',
    );
    expect(CopyClipboardAlertMessage.transaction()).toBe(
      'notifications.transaction_id_copied_to_clipboard',
    );
  });
});

describe('useCopyClipboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('does nothing when called without a value', async () => {
    const { result } = renderHookWithProvider(() => useCopyClipboard());
    await act(async () => {
      await result.current('');
    });
    expect(ClipboardManager.setString).not.toHaveBeenCalled();
    expect(showAlert).not.toHaveBeenCalled();
  });

  it('copies value and dispatches alert with default message when no alertText is provided', async () => {
    const { result } = renderHookWithProvider(() => useCopyClipboard());

    await act(async () => {
      await result.current('0xabc');
    });

    expect(ClipboardManager.setString).toHaveBeenCalledWith('0xabc');
    expect(showAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        isVisible: true,
        autodismiss: 1500,
        content: 'clipboard-alert',
        data: { msg: CopyClipboardAlertMessage.default() },
      }),
    );
  });

  it('dispatches protectWalletModalVisible after a 2s timeout', async () => {
    const { result } = renderHookWithProvider(() => useCopyClipboard());

    await act(async () => {
      await result.current('0xabc', 'custom alert message');
    });

    expect(showAlert).toHaveBeenCalledWith(
      expect.objectContaining({ data: { msg: 'custom alert message' } }),
    );

    expect(protectWalletModalVisible).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(protectWalletModalVisible).toHaveBeenCalled();
  });
});
