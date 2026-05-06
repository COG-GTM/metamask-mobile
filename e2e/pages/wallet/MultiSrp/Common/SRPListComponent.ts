import { SRPListSelectorsIDs } from '../../../../selectors/MultiSRP/SRPList.selectors';
import Matchers from '../../../../utils/Matchers';

class SRPListComponent {
  get SRP_LIST() {
    return Matchers.getElementByID(
      (SRPListSelectorsIDs as Record<string, string>).CONTAINER ??
        SRPListSelectorsIDs.SRP_LIST,
    );
  }
}

export default new SRPListComponent();
