import {
  selectSignatureRequests,
  selectSignatureRequestById,
} from './signatureController';

const mockState = {
  engine: {
    backgroundState: {
      SignatureController: {
        signatureRequests: {
          'req-1': { id: 'req-1', type: 'personal_sign', status: 'unapproved' },
          'req-2': { id: 'req-2', type: 'eth_signTypedData_v4', status: 'signed' },
        },
      },
    },
  },
} as any;

describe('signatureController selectors', () => {
  it('selectSignatureRequests returns all signature requests', () => {
    const result = selectSignatureRequests(mockState);
    expect(result).toEqual({
      'req-1': { id: 'req-1', type: 'personal_sign', status: 'unapproved' },
      'req-2': { id: 'req-2', type: 'eth_signTypedData_v4', status: 'signed' },
    });
  });

  it('selectSignatureRequestById returns specific request', () => {
    const result = selectSignatureRequestById(mockState, 'req-1');
    expect(result).toEqual({ id: 'req-1', type: 'personal_sign', status: 'unapproved' });
  });

  it('selectSignatureRequestById returns undefined for non-existent id', () => {
    const result = selectSignatureRequestById(mockState, 'non-existent');
    expect(result).toBeUndefined();
  });
});
