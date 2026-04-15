

import reducer from '.';

const intialState = {
  reloadAccounts: false
};

const emptyAction = {
  type: null,
  reloadAccounts: false
};

describe('accounts reducer', () => {
  it('should return the initial state', () => {
    expect(reducer(undefined, emptyAction)).toEqual(intialState);
  });

  describe('setReloadAccount', () => {
    it('setReloadAccount should return true when payload contain reloadAcounts: true', () => {
      const state = reducer(undefined, emptyAction);

      const action = {
        type: 'SET_RELOAD_ACCOUNTS',
        reloadAccounts: true
      };
      expect(reducer(state, action)).toEqual({
        reloadAccounts: true
      });
    });

    it('setReloadAccount should return false when payload contain reloadAcounts: false', () => {
      const state = reducer(undefined, emptyAction);

      const action = {
        type: 'SET_RELOAD_ACCOUNTS',
        reloadAccounts: false
      };
      expect(reducer(state, action)).toEqual({
        reloadAccounts: false
      });
    });
  });
});