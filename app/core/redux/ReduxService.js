import Logger from '../../util/Logger';


/**
 * ReduxService class that manages the Redux store
 */
class ReduxService {
  static #reduxStore;

  static #assertReduxStoreType(store) {
    if (
    typeof store.dispatch !== 'function' ||
    typeof store.getState !== 'function')
    {
      const error = new Error('Redux store is not a valid store!');
      Logger.error(error);
      throw error;
    }
    return this.#reduxStore;
  }

  static #assertReduxStoreExists() {
    if (!this.#reduxStore) {
      const error = new Error('Redux store does not exist!');
      Logger.error(error);
      throw error;
    }
    return this.#reduxStore;
  }

  /**
   * Set the store in the Redux class
   * @param store
   */
  static set store(store) {
    this.#assertReduxStoreType(store);
    this.#reduxStore = store;
  }

  /**
   * Get the store from the Redux class
   */
  static get store() {
    this.#assertReduxStoreExists();
    return this.#reduxStore;
  }
}

export default ReduxService;