import { createNavigationDetails } from '../../../util/navigation/navUtils';
import Routes from '../../../constants/navigation/Routes';






const createBrowserNavDetails = createNavigationDetails(
  Routes.BROWSER.HOME,
  Routes.BROWSER.VIEW
);

export default createBrowserNavDetails;