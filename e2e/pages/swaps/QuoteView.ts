import Matchers from '../../utils/Matchers';
import Gestures from '../../utils/Gestures';
import {
  QuoteViewSelectorIDs,
  QuoteViewSelectorText,
} from '../../selectors/swaps/QuoteView.selectors';

class QuoteView {
  get getQuotes() {
    return Matchers.getElementByText(QuoteViewSelectorText.GET_QUOTES);
  }

  get cancelButton() {
    return Matchers.getElementByText(QuoteViewSelectorText.CANCEL);
  }

  get sourceToken() {
    return Matchers.getElementByID(QuoteViewSelectorIDs.SOURCE_TOKEN);
  }

  get destToken() {
    return Matchers.getElementByID(QuoteViewSelectorIDs.DEST_TOKEN);
  }

  get searchToken() {
    return Matchers.getElementByID(QuoteViewSelectorIDs.SEARCH_TOKEN);
  }

  get maxSlippage() {
    return Matchers.getElementByID(QuoteViewSelectorIDs.MAX_SLIPPAGE);
  }

  async enterSwapAmount(amount: string) {
    for (const digit of amount) {
      const elem = Matchers.getElementByText(digit);
      await Gestures.waitAndTap(elem);
    }
  }

  async tapOnSelectSourceToken() {
    await Gestures.waitAndTap(this.sourceToken);
  }

  async tapOnSelectDestToken() {
    await Gestures.waitAndTap(this.destToken);
  }

  async tapSearchToken() {
    await Gestures.waitAndTap(this.searchToken);
  }

  async typeSearchToken(symbol: string) {
    await Gestures.typeTextAndHideKeyboard(this.searchToken, symbol);
  }

  async selectToken(symbol: string, index = 1) {
    const elem = Matchers.getElementByText(symbol, index);
    await Gestures.waitAndTap(elem);
  }

  async tapOnGetQuotes() {
    await device.disableSynchronization();
    await Gestures.waitAndTap(this.getQuotes);
  }

  async tapOnCancelButton() {
    await Gestures.waitAndTap(this.cancelButton);
  }
}

export default new QuoteView();
