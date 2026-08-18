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

  get controlBar() {
    return Matchers.getElementByID(ActivitiesViewSelectorsIDs.CONTROL_BAR);
  }

  get searchInput() {
    return Matchers.getElementByID(ActivitiesViewSelectorsIDs.SEARCH_INPUT);
  }

  get typeFilterChip() {
    return Matchers.getElementByID(ActivitiesViewSelectorsIDs.TYPE_FILTER_CHIP);
  }

  get statusFilterChip() {
    return Matchers.getElementByID(
      ActivitiesViewSelectorsIDs.STATUS_FILTER_CHIP,
    );
  }

  get dateFilterChip() {
    return Matchers.getElementByID(ActivitiesViewSelectorsIDs.DATE_FILTER_CHIP);
  }

  get filtersBottomSheet() {
    return Matchers.getElementByID(
      ActivitiesViewSelectorsIDs.FILTERS_BOTTOM_SHEET,
    );
  }

  get activeFilterToken() {
    return Matchers.getElementByID(
      ActivitiesViewSelectorsIDs.ACTIVE_FILTER_TOKEN,
    );
  }

  get clearAllFiltersButton() {
    return Matchers.getElementByID(
      ActivitiesViewSelectorsIDs.CLEAR_ALL_FILTERS,
    );
  }

  get filteredEmptyState() {
    return Matchers.getElementByID(
      ActivitiesViewSelectorsIDs.FILTERED_EMPTY_STATE,
    );
  }

  get exportCsvButton() {
    return Matchers.getElementByID(
      ActivitiesViewSelectorsIDs.EXPORT_CSV_BUTTON,
    );
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


  transactionStatus(row) {
    return Matchers.getElementByID(`transaction-status-${row}`);
  }

  generateSwapActivityLabel(sourceToken, destinationToken) {
    let title = ActivitiesViewSelectorsText.SWAP;
    title = title.replace('{{sourceToken}}', sourceToken);
    title = title.replace('{{destinationToken}}', destinationToken);
    return title;
  }

  generateApprovedTokenActivityLabel(sourceToken) {
    let title = ActivitiesViewSelectorsText.APPROVE;
    title = title.replace('{{sourceToken}}', sourceToken);
    title = title.replace('{{upTo}}', '.*');
    return new RegExp(`^${title}`);
  }

  swapActivityTitle(sourceToken, destinationToken) {
    return Matchers.getElementByText(
      this.generateSwapActivityLabel(sourceToken, destinationToken),
    );
  }

  tokenApprovalActivity(sourceToken) {
    return Matchers.getElementByText(
      this.generateApprovedTokenActivityLabel(sourceToken),
    );
  }

  async tapOnSwapActivity(sourceToken, destinationToken) {
    const element = this.swapActivityTitle(sourceToken, destinationToken);
    await Gestures.waitAndTap(element);
  }

  async typeSearchQuery(query) {
    await Gestures.typeTextAndHideKeyboard(this.searchInput, query);
  }

  async clearSearchQuery() {
    await Gestures.clearField(this.searchInput);
  }

  async tapTypeFilterChip() {
    await Gestures.waitAndTap(this.typeFilterChip);
  }

  async tapStatusFilterChip() {
    await Gestures.waitAndTap(this.statusFilterChip);
  }

  async tapDateFilterChip() {
    await Gestures.waitAndTap(this.dateFilterChip);
  }

  async tapFilterOption(optionText) {
    await Gestures.waitAndTap(Matchers.getElementByText(optionText));
  }

  async tapClearAllFilters() {
    await Gestures.waitAndTap(this.clearAllFiltersButton);
  }

  async tapConfirmedTransaction() {
    await Gestures.waitAndTap(this.confirmedLabel);
  }
  async swipeDown() {
    await Gestures.swipe(this.container, 'down', 'slow', 0.5);
  }
}

export default new ActivitiesView();
