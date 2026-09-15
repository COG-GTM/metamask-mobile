import reducer, { initialState } from './index';
import {
  toggleCollectibleContractModal,
  type ModalsAction,
} from '../../actions/modals';

describe('modalsReducer', () => {
  it('returns initial state for an unknown action', () => {
    expect(
      reducer(undefined, { type: 'UNKNOWN' } as unknown as ModalsAction),
    ).toEqual(initialState);
  });

  it('toggles the collectible contract modal', () => {
    expect(reducer(undefined, toggleCollectibleContractModal())).toEqual({
      ...initialState,
      collectibleContractModalVisible: true,
    });
  });
});
