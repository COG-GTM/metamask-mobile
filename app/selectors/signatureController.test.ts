import { selectSignatureRequests, selectSignatureRequestById } from './signatureController';

describe('SignatureController Selectors', () => {
  const mockState = {
    engine: {
      backgroundState: {
        SignatureController: {
          signatureRequests: {
            'req-1': { id: 'req-1', type: 'personal_sign' },
            'req-2': { id: 'req-2', type: 'eth_signTypedData' },
          },
        },
      },
    },
  } as any;

  it('selectSignatureRequests should return all signature requests', () => {
    const result = selectSignatureRequests(mockState);
    expect(Object.keys(result)).toHaveLength(2);
    expect(result['req-1'].type).toBe('personal_sign');
  });

  it('selectSignatureRequestById should return specific request', () => {
    const result = selectSignatureRequestById(mockState, 'req-1');
    expect(result?.id).toBe('req-1');
  });

  it('selectSignatureRequestById should return undefined for missing id', () => {
    const result = selectSignatureRequestById(mockState, 'nonexistent');
    expect(result).toBeUndefined();
  });
});
