import {
  generateOpt } from

'../../MetaMetrics.events';var

EVENT_NAME = /*#__PURE__*/function (EVENT_NAME) {EVENT_NAME["ADVANCED_DETAILS_CLICKED"] = "Confirmation Advanced Details Clicked";EVENT_NAME["BLOCKAID_ALERT_LINK_CLICKED"] = "Blockaid Alert Link Clicked";EVENT_NAME["TOOLTIP_CLICKED"] = "Confirmation Tooltip Clicked";EVENT_NAME["SCREEN_VIEWED"] = "Confirmation Screen Viewed";return EVENT_NAME;}(EVENT_NAME || {});var






TRANSACTION_EVENT_NAMES = /*#__PURE__*/function (TRANSACTION_EVENT_NAMES) {TRANSACTION_EVENT_NAMES["TRANSACTION_ADDED"] = "Transaction Added";TRANSACTION_EVENT_NAMES["TRANSACTION_APPROVED"] = "Transaction Approved";


  // Finalized is the unified event that is triggered
  // when the transaction is confirmed, dropped or failed
  TRANSACTION_EVENT_NAMES["TRANSACTION_FINALIZED"] = "Transaction Finalized";TRANSACTION_EVENT_NAMES["TRANSACTION_REJECTED"] = "Transaction Rejected";TRANSACTION_EVENT_NAMES["TRANSACTION_SUBMITTED"] = "Transaction Submitted";return TRANSACTION_EVENT_NAMES;}(TRANSACTION_EVENT_NAMES || {});




// This function helps prevent repeat of type conversions
const createEvent = (name) =>
generateOpt(name);

export const CONFIRMATION_EVENTS = {
  ADVANCED_DETAILS_CLICKED: createEvent(EVENT_NAME.ADVANCED_DETAILS_CLICKED),
  BLOCKAID_ALERT_LINK_CLICKED: createEvent(
    EVENT_NAME.BLOCKAID_ALERT_LINK_CLICKED
  ),
  SCREEN_VIEWED: createEvent(EVENT_NAME.SCREEN_VIEWED),
  TOOLTIP_CLICKED: createEvent(EVENT_NAME.TOOLTIP_CLICKED)
};

export const TRANSACTION_EVENTS = {
  TRANSACTION_ADDED: createEvent(TRANSACTION_EVENT_NAMES.TRANSACTION_ADDED),
  TRANSACTION_APPROVED: createEvent(
    TRANSACTION_EVENT_NAMES.TRANSACTION_APPROVED
  ),
  TRANSACTION_FINALIZED: createEvent(
    TRANSACTION_EVENT_NAMES.TRANSACTION_FINALIZED
  ),
  TRANSACTION_REJECTED: createEvent(
    TRANSACTION_EVENT_NAMES.TRANSACTION_REJECTED
  ),
  TRANSACTION_SUBMITTED: createEvent(
    TRANSACTION_EVENT_NAMES.TRANSACTION_SUBMITTED
  )
};