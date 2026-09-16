import {
  NetworkListModalSelectorsIDs,
  NetworkListModalSelectorsText,
} from '../../selectors/Network/NetworkListModal.selectors';
import Matchers from '../../utils/Matchers';
import Gestures from '../../utils/Gestures';
import TestHelpers from '../../helpers';
import { NetworksViewSelectorsIDs } from '../../selectors/Settings/NetworksView.selectors';

class NetworkListModal {
  get networkScroll() {
    return Matchers.getElementByID(NetworkListModalSelectorsIDs.SCROLL);
  }

  get closeIcon() {
    return Matchers.getElementByID(NetworksViewSelectorsIDs.CLOSE_ICON);
  }

  get deleteNetworkButton() {
    return Matchers.getElementByText(
      NetworkListModalSelectorsText.DELETE_NETWORK,
    );
  }

  get addPopularNetworkButton() {
    return Matchers.getElementByText(
      NetworkListModalSelectorsText.ADD_POPULAR_NETWORK_BUTTON,
    );
  }

  get networkSearchInput() {
    return Matchers.getElementByID(
      NetworksViewSelectorsIDs.SEARCH_NETWORK_INPUT_BOX_ID,
    );
  }

  get selectNetwork() {
    return Matchers.getElementByText(
      NetworkListModalSelectorsText.SELECT_NETWORK,
    );
  }

  get testNetToggle() {
    return Matchers.getElementByID(
      NetworkListModalSelectorsIDs.TEST_NET_TOGGLE,
    );
  }

  get deleteButton() {
    return Matchers.getElementByID('delete-network-button');
  }

  async getCustomNetwork(network: string, custom = false) {
    if (device.getPlatform() === 'android' || !custom) {
      return Matchers.getElementByText(network);
    }

    return Matchers.getElementByID(
      NetworkListModalSelectorsIDs.CUSTOM_NETWORK_CELL(network),
    );
  }

  async tapDeleteButton() {
    await Gestures.waitAndTap(this.deleteNetworkButton);
  }

  async scrollToTopOfNetworkList() {
    await Gestures.swipe(
      this.networkScroll as Promise<Detox.IndexableNativeElement>,
      'down',
      'fast',
    );
  }

  async changeNetworkTo(networkName: string, custom?: boolean) {
    const elem = this.getCustomNetwork(networkName, custom);
    await TestHelpers.delay(3000);
    await Gestures.waitAndTap(elem as Promise<Detox.IndexableNativeElement>);
    await TestHelpers.delay(3000);
  }

  async scrollToBottomOfNetworkList() {
    await Gestures.swipe(
      this.networkScroll as Promise<Detox.IndexableNativeElement>,
      'up',
      'fast',
    );
  }

  async swipeToDismissModal() {
    await Gestures.swipe(
      this.selectNetwork as Promise<Detox.IndexableNativeElement>,
      'down',
      'slow',
      0.9,
    );
  }

  async tapTestNetworkSwitch() {
    await Gestures.waitAndTap(this.testNetToggle);
  }

  async longPressOnNetwork(networkName: string) {
    const network = Matchers.getElementByText(networkName);
    await Gestures.tapAndLongPress(
      network as Promise<Detox.IndexableNativeElement>,
    );
  }

  async SearchNetworkName(networkName: string) {
    await Gestures.typeTextAndHideKeyboard(
      this.networkSearchInput as Promise<Detox.IndexableNativeElement>,
      networkName,
    );
  }

  async tapClearSearch() {
    await Gestures.waitAndTap(this.closeIcon);
  }

  async tapAddNetworkButton() {
    await TestHelpers.delay(3000);
    await Gestures.waitAndTap(this.addPopularNetworkButton);
  }
  async deleteNetwork() {
    await Gestures.waitAndTap(this.deleteButton);
  }
}

export default new NetworkListModal();
