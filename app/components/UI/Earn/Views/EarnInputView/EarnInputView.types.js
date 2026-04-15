

import { strings } from '../../../../../../locales/i18n';

export let EARN_INPUT_VIEW_ACTIONS = /*#__PURE__*/function (EARN_INPUT_VIEW_ACTIONS) {EARN_INPUT_VIEW_ACTIONS["STAKE"] = "STAKE";EARN_INPUT_VIEW_ACTIONS["LEND"] = "LEND";return EARN_INPUT_VIEW_ACTIONS;}({});




export const EARN_INPUT_ACTION_TO_LABEL_MAP = {
  [EARN_INPUT_VIEW_ACTIONS.STAKE]: strings('stake.stake'),
  [EARN_INPUT_VIEW_ACTIONS.LEND]: strings('stake.deposit')
};