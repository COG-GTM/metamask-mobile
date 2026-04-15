








/**
 * Build a mock for the ControllerInitRequest.
 *
 * @returns A mocked ControllerInitRequest.
 */
export function buildControllerInitRequestMock(
controllerMessenger)
{
  return {
    controllerMessenger:
    controllerMessenger,
    getController: jest.fn(),
    getGlobalChainId: jest.fn(),
    getState: jest.fn(),
    initMessenger: jest.fn(),
    persistedState: {}
  };
}

/**
 * Create a generic mock controller init function
 *
 * @template T - The controller type
 * @template M - The messenger type
 * @returns A mock controller init function
 */
export function createMockControllerInitFunction(


requiredController) {
  return (request) => {
    const { getController } = request;

    if (requiredController) {
      getController(requiredController);
    }

    return {
      controller: jest.fn()
    };
  };
}