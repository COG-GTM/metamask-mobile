import { NetworkConnectMultiSelectorSelectorsIDs } from '../../selectors/Browser/NetworkConnectMultiSelector.selectors';
import Matchers from '../../utils/Matchers';
import Gestures from '../../utils/Gestures';
import { expect as detoxExpect, waitFor } from 'detox';
class NetworkConnectMultiSelector {
  get updateButton() {
    return Matchers.getElementByID(
      NetworkConnectMultiSelectorSelectorsIDs.UPDATE_CHAIN_PERMISSIONS,
    );
  }

  get backButton() {
    return Matchers.getElementByID(
      NetworkConnectMultiSelectorSelectorsIDs.BACK_BUTTON,
    );
  }

  async tapUpdateButton() {
    await Gestures.waitAndTap(this.updateButton);
  }

  async tapBackButton() {
    await Gestures.waitAndTap(this.backButton);
  }

  async isNetworkChainPermissionSelected(chainName: string) {
    const chainPermissionTestId = `${chainName}-selected`;

    const element = await Matchers.getElementByID(chainPermissionTestId);
    await waitFor(element).toBeVisible().withTimeout(10000);

    return detoxExpect(element).toExist();
  }

  async isNetworkChainPermissionNotSelected(chainName: string) {
    const chainPermissionTestId = `${chainName}-not-selected`;

    const element = await Matchers.getElementByID(chainPermissionTestId);
    await waitFor(element).toBeVisible().withTimeout(10000);

    return detoxExpect(element).toExist();
  }
}

export default new NetworkConnectMultiSelector();
