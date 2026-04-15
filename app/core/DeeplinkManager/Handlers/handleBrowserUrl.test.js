import handleBrowserUrl from './handleBrowserUrl';

import { InteractionManager } from 'react-native';

jest.mock('react-native', () => ({
  InteractionManager: {
    runAfterInteractions: jest.fn((callback) => {
      callback();
    })
  }
}));

describe('handleBrowserUrl', () => {
  const mockNavigate = jest.fn();
  const mockRunAfterInteractions =
  InteractionManager.runAfterInteractions;

  const deeplinkManager = {
    navigation: {
      navigate: mockNavigate
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call runAfterInteractions', () => {
    const callback = jest.fn();
    const testUrl = 'https://test.com';

    handleBrowserUrl({ deeplinkManager, url: testUrl, callback });

    expect(mockRunAfterInteractions).toHaveBeenCalledWith(expect.any(Function));
  });
});