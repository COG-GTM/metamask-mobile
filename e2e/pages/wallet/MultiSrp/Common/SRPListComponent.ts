import { SRPListSelectorsIDs } from '../../../../selectors/MultiSRP/SRPList.selectors';
import Matchers from '../../../../utils/Matchers';

class SRPListComponent {
  get SRP_LIST() {
    // @ts-expect-error CONTAINER is not defined on SRPListSelectorsIDs (pre-existing; resolves to undefined at runtime)
    return Matchers.getElementByID(SRPListSelectorsIDs.CONTAINER);
  }
}

export default new SRPListComponent();
