import Matchers from '../../utils/Matchers';
import Gestures from '../../utils/Gestures';


class SelectCurrencyView {
  async tapCurrencyOption(currency: string) {
    const currencyOption = Matchers.getElementByText(currency);
    await Gestures.waitAndTap(currencyOption);
  }
}

export default new SelectCurrencyView();
