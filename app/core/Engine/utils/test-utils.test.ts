import {
  buildControllerInitRequestMock,
  createMockControllerInitFunction,
} from './test-utils';
import type { BaseControllerMessenger } from '../types';

describe('Engine test-utils', () => {
  describe('buildControllerInitRequestMock', () => {
    it('returns a mocked ControllerInitRequest wrapping the passed messenger', () => {
      const messenger = { id: 'fake-messenger' } as unknown as BaseControllerMessenger;
      const request = buildControllerInitRequestMock(messenger);

      expect(request.controllerMessenger).toBe(messenger);
      expect(jest.isMockFunction(request.getController)).toBe(true);
      expect(jest.isMockFunction(request.getGlobalChainId)).toBe(true);
      expect(jest.isMockFunction(request.getState)).toBe(true);
      expect(request.persistedState).toEqual({});
    });
  });

  describe('createMockControllerInitFunction', () => {
    it('returns a function that produces a controller result', () => {
      const init = createMockControllerInitFunction();
      const getController = jest.fn();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const request = buildControllerInitRequestMock({} as any);
      request.getController = getController;

      const result = init(request);

      expect(result.controller).toBeDefined();
      expect(getController).not.toHaveBeenCalled();
    });

    it('calls getController with the required controller name when provided', () => {
      const init = createMockControllerInitFunction('DependentController');
      const getController = jest.fn();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const request = buildControllerInitRequestMock({} as any);
      request.getController = getController;

      init(request);

      expect(getController).toHaveBeenCalledWith('DependentController');
    });
  });
});
