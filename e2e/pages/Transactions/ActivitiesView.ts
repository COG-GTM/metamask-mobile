import {
  ActivitiesViewSelectorsIDs,
  ActivitiesViewSelectorsText,
} from '../../selectors/Transactions/ActivitiesView.selectors';
import Matchers from '../../utils/Matchers';
import Gestures from '../../utils/Gestures';

class ActivitiesView {

  get title() {
    return Matchers.getElementByText(ActivitiesViewSelectorsText.TITLE);
  }

  get container() {
    return Matchers.getElementByID(ActivitiesViewSelectorsIDs.CONTAINER);
  }

  get confirmedLabel() {
    return Matchers.getElementByText(ActivitiesViewSelectorsText.CONFIRM_TEXT);
  }

  get stakeDepositedLabel() {
    return Matchers.getElementByText(ActivitiesViewSelectorsText.STAKE_DEPOSIT);
  }

  get stakeMoreDepositedLabel() {
    return Matchers.getElementByText(ActivitiesViewSelectorsText.STAKE_DEPOSIT, 0);
  }

  get unstakeLabel() {
    return Matchers.getElementByText(ActivitiesViewSelectorsText.UNSTAKE);
  }

  get stackingClaimLabel() {
    return Matchers.getElementByText(ActivitiesViewSelectorsText.STAKING_CLAIM);
  }


  transactionStatus(row: number | string) {
    return Matchers.getElementByID(`transaction-status-${row}`);
  }

  generateSwapActivityLabel(sourceToken: string, destinationToken: string) {
    let title = ActivitiesViewSelectorsText.SWAP;
    title = title.replace('{{sourceToken}}', sourceToken);
    title = title.replace('{{destinationToken}}', destinationToken);
    return title;
  }

  generateApprovedTokenActivityLabel(sourceToken: string) {
    let title = ActivitiesViewSelectorsText.APPROVE;
    title = title.replace('{{sourceToken}}', sourceToken);
    title = title.replace('{{upTo}}', '.*');
    return new RegExp(`^${title}`);
  }

  swapActivityTitle(sourceToken: string, destinationToken: string) {
    return Matchers.getElementByText(
      this.generateSwapActivityLabel(sourceToken, destinationToken),
    );
  }

  tokenApprovalActivity(sourceToken: string) {
    return Matchers.getElementByText(
      this.generateApprovedTokenActivityLabel(sourceToken),
    );
  }

  async tapOnSwapActivity(sourceToken: string, destinationToken: string) {
    const swapTitleElement = this.swapActivityTitle(
      sourceToken,
      destinationToken,
    );
    await Gestures.waitAndTap(swapTitleElement);
  }
  async tapConfirmedTransaction() {
    await Gestures.waitAndTap(this.confirmedLabel);
  }
  async swipeDown() {
    await Gestures.swipe(this.container, 'down', 'slow', 0.5);
  }
}

export default new ActivitiesView();
