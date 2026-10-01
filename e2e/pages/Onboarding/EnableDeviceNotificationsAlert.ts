import Gestures from '../../utils/Gestures';
import Matchers from '../../utils/Matchers';

import {
  EnableDeviceNotificationsAlertSelectorText
} from '../../selectors/Onboarding/EnableDeviceNotificationsAlert.selectors';

class EnableDeviceNotificationsAlert {
  get stepOneContainer() {
    return Matchers.getSystemElementByText(EnableDeviceNotificationsAlertSelectorText.CONTAINER);
  }

  get getEnableDeviceNotificationsButton() {
    return Matchers.getSystemElementByText(
      EnableDeviceNotificationsAlertSelectorText.YES_BUTTON,
    );
  }

  async tapOnEnableDeviceNotificationsButton() {
    await Gestures.waitAndTap(
      this.getEnableDeviceNotificationsButton as unknown as Promise<Detox.IndexableNativeElement>,
    );
  }
}

export default new EnableDeviceNotificationsAlert();
