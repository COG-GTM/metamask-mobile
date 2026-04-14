import { setInfuraAvailabilityBlocked, setInfuraAvailabilityNotBlocked } from '.';

jest.mock('../../reducers/infuraAvailability', () => ({
  INFURA_AVAILABILITY_BLOCKED: 'INFURA_AVAILABILITY_BLOCKED',
  INFURA_AVAILABILITY_NOT_BLOCKED: 'INFURA_AVAILABILITY_NOT_BLOCKED',
}));

describe('InfuraAvailability Actions', () => {
  it('setInfuraAvailabilityBlocked should return correct action', () => {
    expect(setInfuraAvailabilityBlocked()).toStrictEqual({
      type: 'INFURA_AVAILABILITY_BLOCKED',
    });
  });

  it('setInfuraAvailabilityNotBlocked should return correct action', () => {
    expect(setInfuraAvailabilityNotBlocked()).toStrictEqual({
      type: 'INFURA_AVAILABILITY_NOT_BLOCKED',
    });
  });
});
