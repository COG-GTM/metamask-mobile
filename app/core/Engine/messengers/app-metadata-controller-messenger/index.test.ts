import { getAppMetadataControllerMessenger } from '.';

describe('getAppMetadataControllerMessenger', () => {
  it('should return a restricted messenger with no allowed actions or events', () => {
    const mockRestricted = jest.fn().mockReturnValue('restricted-messenger');
    const mockMessenger = { getRestricted: mockRestricted } as any;

    const result = getAppMetadataControllerMessenger(mockMessenger);

    expect(result).toBe('restricted-messenger');
    expect(mockRestricted).toHaveBeenCalledWith({
      name: 'AppMetadataController',
      allowedEvents: [],
      allowedActions: [],
    });
  });
});
