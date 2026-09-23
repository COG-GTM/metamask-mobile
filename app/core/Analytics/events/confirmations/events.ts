import {
  generateOpt,
  EVENT_NAME as METRICS_EVENT_NAME,
} from '../../MetaMetrics.events';

enum EVENT_NAME {
  ADVANCED_DETAILS_CLICKED = 'Confirmation Advanced Details Clicked',
  BLOCKAID_ALERT_LINK_CLICKED = 'Blockaid Alert Link Clicked',
  SECURITY_ALERTS_API_REQUEST_COMPLETED = 'Security Alerts API Request Completed',
  SECURITY_ALERTS_API_REQUEST_FAILED = 'Security Alerts API Request Failed',
  TOOLTIP_CLICKED = 'Confirmation Tooltip Clicked',
  SCREEN_VIEWED = 'Confirmation Screen Viewed',
}

enum TRANSACTION_EVENT_NAMES {
  TRANSACTION_ADDED = 'Transaction Added',
  TRANSACTION_APPROVED = 'Transaction Approved',
  // Finalized is the unified event that is triggered
  // when the transaction is confirmed, dropped or failed
  TRANSACTION_FINALIZED = 'Transaction Finalized',
  TRANSACTION_REJECTED = 'Transaction Rejected',
  TRANSACTION_SUBMITTED = 'Transaction Submitted',
}

// This function helps prevent repeat of type conversions
const createEvent = (name: EVENT_NAME | TRANSACTION_EVENT_NAMES) =>
  generateOpt(name as unknown as METRICS_EVENT_NAME);

export const CONFIRMATION_EVENTS = {
  ADVANCED_DETAILS_CLICKED: createEvent(EVENT_NAME.ADVANCED_DETAILS_CLICKED),
  BLOCKAID_ALERT_LINK_CLICKED: createEvent(
    EVENT_NAME.BLOCKAID_ALERT_LINK_CLICKED,
  ),
  SCREEN_VIEWED: createEvent(EVENT_NAME.SCREEN_VIEWED),
  SECURITY_ALERTS_API_REQUEST_COMPLETED: createEvent(
    EVENT_NAME.SECURITY_ALERTS_API_REQUEST_COMPLETED,
  ),
  SECURITY_ALERTS_API_REQUEST_FAILED: createEvent(
    EVENT_NAME.SECURITY_ALERTS_API_REQUEST_FAILED,
  ),
  TOOLTIP_CLICKED: createEvent(EVENT_NAME.TOOLTIP_CLICKED),
};

export const TRANSACTION_EVENTS = {
  TRANSACTION_ADDED: createEvent(TRANSACTION_EVENT_NAMES.TRANSACTION_ADDED),
  TRANSACTION_APPROVED: createEvent(
    TRANSACTION_EVENT_NAMES.TRANSACTION_APPROVED,
  ),
  TRANSACTION_FINALIZED: createEvent(
    TRANSACTION_EVENT_NAMES.TRANSACTION_FINALIZED,
  ),
  TRANSACTION_REJECTED: createEvent(
    TRANSACTION_EVENT_NAMES.TRANSACTION_REJECTED,
  ),
  TRANSACTION_SUBMITTED: createEvent(
    TRANSACTION_EVENT_NAMES.TRANSACTION_SUBMITTED,
  ),
};
