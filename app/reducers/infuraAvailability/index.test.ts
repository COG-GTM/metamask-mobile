import reducer, { initialState } from './index';
import {
  setInfuraAvailabilityBlocked,
  type InfuraAvailabilityAction,
} from '../../actions/infuraAvailability';

describe('infuraAvailabilityReducer', () => {
  it('returns initial state for an unknown action', () => {
    expect(
      reducer(
        undefined,
        { type: 'UNKNOWN' } as unknown as InfuraAvailabilityAction,
      ),
    ).toEqual(initialState);
  });

  it('marks Infura as blocked', () => {
    expect(reducer(undefined, setInfuraAvailabilityBlocked())).toEqual({
      isBlocked: true,
    });
  });
});
