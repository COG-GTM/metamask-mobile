export let ETH_ACTIONS = /*#__PURE__*/function (ETH_ACTIONS) {ETH_ACTIONS["TRANSFER"] = "transfer";ETH_ACTIONS["APPROVE"] = "approve";return ETH_ACTIONS;}({});




export let PROTOCOLS = /*#__PURE__*/function (PROTOCOLS) {PROTOCOLS["HTTP"] = "http";PROTOCOLS["HTTPS"] = "https";PROTOCOLS["WC"] = "wc";PROTOCOLS["ETHEREUM"] = "ethereum";PROTOCOLS["DAPP"] = "dapp";PROTOCOLS["METAMASK"] = "metamask";return PROTOCOLS;}({});








export let ACTIONS = /*#__PURE__*/function (ACTIONS) {ACTIONS["DAPP"] = "dapp";ACTIONS["SEND"] = "send";ACTIONS["APPROVE"] = "approve";ACTIONS["PAYMENT"] = "payment";ACTIONS["FOCUS"] = "focus";ACTIONS["WC"] = "wc";ACTIONS["CONNECT"] = "connect";ACTIONS["MMSDK"] = "mmsdk";ACTIONS["ANDROID_SDK"] = "bind";ACTIONS["BUY"] = "buy";ACTIONS["BUY_CRYPTO"] = "buy-crypto";ACTIONS["SELL"] = "sell";ACTIONS["SELL_CRYPTO"] = "sell-crypto";ACTIONS["EMPTY"] = "";return ACTIONS;}({});
















export const PREFIXES = {
  [ACTIONS.DAPP]: 'https://',
  [ACTIONS.SEND]: 'ethereum:',
  [ACTIONS.APPROVE]: 'ethereum:',
  [ACTIONS.FOCUS]: '',
  [ACTIONS.EMPTY]: '',
  [ACTIONS.PAYMENT]: '',
  [ACTIONS.WC]: '',
  [ACTIONS.CONNECT]: '',
  [ACTIONS.ANDROID_SDK]: '',
  [ACTIONS.BUY]: '',
  [ACTIONS.SELL]: '',
  [ACTIONS.BUY_CRYPTO]: '',
  [ACTIONS.SELL_CRYPTO]: '',
  METAMASK: 'metamask://'
};