import {
  STATELESS_NON_CONTROLLER_NAMES,
  BACKGROUND_STATE_CHANGE_EVENT_NAMES,
  swapsSupportedChainIds,
} from './constants';

describe('Engine constants', () => {
  describe('STATELESS_NON_CONTROLLER_NAMES', () => {
    it('contains AssetsContractController', () => {
      expect(STATELESS_NON_CONTROLLER_NAMES).toContain('AssetsContractController');
    });

    it('contains NftDetectionController', () => {
      expect(STATELESS_NON_CONTROLLER_NAMES).toContain('NftDetectionController');
    });

    it('contains TokenDetectionController', () => {
      expect(STATELESS_NON_CONTROLLER_NAMES).toContain('TokenDetectionController');
    });

    it('is an array with expected length', () => {
      expect(STATELESS_NON_CONTROLLER_NAMES.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('BACKGROUND_STATE_CHANGE_EVENT_NAMES', () => {
    it('contains AccountsController:stateChange', () => {
      expect(BACKGROUND_STATE_CHANGE_EVENT_NAMES).toContain('AccountsController:stateChange');
    });

    it('contains NetworkController:stateChange', () => {
      expect(BACKGROUND_STATE_CHANGE_EVENT_NAMES).toContain('NetworkController:stateChange');
    });

    it('contains TransactionController:stateChange', () => {
      expect(BACKGROUND_STATE_CHANGE_EVENT_NAMES).toContain('TransactionController:stateChange');
    });

    it('contains KeyringController:stateChange', () => {
      expect(BACKGROUND_STATE_CHANGE_EVENT_NAMES).toContain('KeyringController:stateChange');
    });

    it('is a non-empty array', () => {
      expect(BACKGROUND_STATE_CHANGE_EVENT_NAMES.length).toBeGreaterThan(10);
    });
  });

  describe('swapsSupportedChainIds', () => {
    it('is an array', () => {
      expect(Array.isArray(swapsSupportedChainIds)).toBe(true);
    });

    it('contains multiple chain ids', () => {
      expect(swapsSupportedChainIds.length).toBeGreaterThan(5);
    });
  });
});
