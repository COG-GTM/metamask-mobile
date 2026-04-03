import Gestures from '../../utils/Gestures';
import Matchers from '../../utils/Matchers';
import { StakeConfirmViewSelectors } from '../../selectors/Stake/StakeConfirmView.selectors';

class StakeConfirmationView {
  get confirmButton() {
    return Matchers.getElementByText(StakeConfirmViewSelectors.CONFIRM);
  }

  async tapConfirmButton() {
    await Gestures.waitAndTap(this.confirmButton);
  }
}

export default new StakeConfirmationView();
