import {
  setInfuraAvailabilityBlocked,
  setInfuraAvailabilityNotBlocked,
} from './';

describe('Infura Availability Actions', () => {
  describe('setInfuraAvailabilityBlocked', () => {
    it('returns INFURA_AVAILABILITY_BLOCKED action', () => {
      const result = setInfuraAvailabilityBlocked();
      expect(result.type).toBe('INFURA_AVAILABILITY_BLOCKED');
    });
  });

  describe('setInfuraAvailabilityNotBlocked', () => {
    it('returns INFURA_AVAILABILITY_NOT_BLOCKED action', () => {
      const result = setInfuraAvailabilityNotBlocked();
      expect(result.type).toBe('INFURA_AVAILABILITY_NOT_BLOCKED');
    });
  });
});
