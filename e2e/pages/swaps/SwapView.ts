import {
  SwapsViewSelectors,
  SwapViewSelectorsTexts,
} from '../../selectors/swaps/SwapsView.selectors.js';

import Matchers from '../../utils/Matchers';
import Gestures from '../../utils/Gestures';
import TestHelpers from '../..//helpers';

class SwapView {
  get quoteSummary() {
    return Matchers.getElementByID(SwapsViewSelectors.QUOTE_SUMMARY);
  }

  get gasFee() {
    return Matchers.getElementByID(SwapsViewSelectors.GAS_FEE);
  }

  get fetchingQuotes() {
    return Matchers.getElementByText(SwapViewSelectorsTexts.FETCHING_QUOTES);
  }

  get swapButton() {
    return device.getPlatform() === 'ios'
      ? Matchers.getElementByID(SwapsViewSelectors.SWAP_BUTTON)
      : Matchers.getElementByLabel(SwapsViewSelectors.SWAP_BUTTON);
  }

  get iUnderstandLabel() {
    return Matchers.getElementByText(SwapViewSelectorsTexts.I_UNDERSTAND);
  }

  generateSwapCompleteLabel(sourceToken: string, destinationToken: string) {
    let title = SwapViewSelectorsTexts.SWAP_CONFIRMED;
    title = title.replace('{{sourceToken}}', sourceToken);
    title = title.replace('{{destinationToken}}', destinationToken);
    return title;
  }

  // Function to check if the button is enabled
  async isButtonEnabled(
    element: Detox.IndexableNativeElement | Detox.NativeElement,
  ): Promise<boolean> {
    const attributes = (await element.getAttributes()) as {
      enabled?: boolean;
    };
    return attributes.enabled === true;
  }

  async tapSwapButton() {
    await Gestures.waitAndTap(this.swapButton);
  }

  async tapIUnderstandPriceWarning() {
    try {
      await Gestures.waitAndTap(this.iUnderstandLabel, 3000);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log(`Price warning not displayed: ${e}`);
    }
  }
}

export default new SwapView();
