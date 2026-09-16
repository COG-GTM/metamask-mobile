import Matchers from '../../../utils/Matchers';
import Gestures from '../../../utils/Gestures';
import { NFTImportScreenSelectorsIDs } from '../../../selectors/wallet/ImportNFTView.selectors';

class ImportNFTView {
  get container() {
    return Matchers.getElementByID(NFTImportScreenSelectorsIDs.CONTAINER);
  }

  get addressInput() {
    return Matchers.getElementByID(
      NFTImportScreenSelectorsIDs.ADDRESS_INPUT_BOX,
    ) as Promise<Detox.IndexableNativeElement>;
  }

  get addressWarningMessage() {
    return Matchers.getElementByID(
      NFTImportScreenSelectorsIDs.ADDRESS_WARNING_MESSAGE,
    );
  }

  get identifierInput() {
    return Matchers.getElementByID(
      NFTImportScreenSelectorsIDs.IDENTIFIER_INPUT_BOX,
    ) as Promise<Detox.IndexableNativeElement>;
  }

  async typeInNFTAddress(address: string) {
    await Gestures.typeTextAndHideKeyboard(this.addressInput, address);
  }

  async typeInNFTIdentifier(identifier: string) {
    await Gestures.typeTextAndHideKeyboard(this.identifierInput, identifier);
  }
}

export default new ImportNFTView();
