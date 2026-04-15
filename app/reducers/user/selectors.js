

/**
 * Selects the user state
 */
export const selectUserState = (state) => state.user;

/**
 * Selects the appServicesReady state
 */
export const selectAppServicesReady = (state) =>
state.user.appServicesReady;

/**
 * Selects the userLoggedIn state
 */
export const selectUserLoggedIn = (state) => state.user.userLoggedIn;