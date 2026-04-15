




/**
 * TODO - remove this once we upgrade TS.
 * There is a typescript compiler bug where Extract does not fully compute unions, which is fixed in a later version
 * GH Issue: https://github.com/MetaMask/metamask-mobile/issues/10364
 * */











export const isOfTypeNodeGuard =
(types) =>
(n) =>
n?.type && types.includes(n.type);