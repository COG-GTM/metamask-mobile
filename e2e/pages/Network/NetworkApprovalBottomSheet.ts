import { NetworkApprovalBottomSheetSelectorsIDs } from '../../selectors/Network/NetworkApprovalBottomSheet.selectors';
import Matchers from '../../utils/Matchers';
import Gestures from '../../utils/Gestures';

class NetworkApprovalBottomSheet {
  get container() {
    return Matchers.getElementByID(
      NetworkApprovalBottomSheetSelectorsIDs.CONTAINER,
    );
  }

  get approvedButton() {
    return Matchers.getElementByID(
      NetworkApprovalBottomSheetSelectorsIDs.APPROVE_BUTTON,
    );
  }
  get cancelButton() {
    return Matchers.getElementByID(
      NetworkApprovalBottomSheetSelectorsIDs.CANCEL_BUTTON,
    );
  }

  get displayName() {
    return Matchers.getElementByID(
      NetworkApprovalBottomSheetSelectorsIDs.DISPLAY_NAME,
    );
  }

  async tapApproveButton() {
    await Gestures.tap(
      this.approvedButton as Promise<Detox.IndexableNativeElement>,
    );
  }
  async tapCancelButton() {
    await Gestures.tap(
      this.cancelButton as Promise<Detox.IndexableNativeElement>,
    );
  }
}

export default new NetworkApprovalBottomSheet();
