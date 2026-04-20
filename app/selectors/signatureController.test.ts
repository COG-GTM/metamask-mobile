import {
  selectSignatureRequestById,
  selectSignatureRequests,
} from './signatureController';
import type { RootState } from '../reducers';

const makeState = (signatureRequests: Record<string, unknown>) =>
  ({
    engine: {
      backgroundState: {
        SignatureController: { signatureRequests },
      },
    },
  } as unknown as RootState);

describe('signatureController selectors', () => {
  const requests = { 'abc-123': { id: 'abc-123', status: 'unapproved' } };

  it('selectSignatureRequests returns the signature requests map', () => {
    expect(selectSignatureRequests(makeState(requests))).toEqual(requests);
  });

  it('selectSignatureRequestById returns the matching request', () => {
    expect(selectSignatureRequestById(makeState(requests), 'abc-123')).toEqual(
      requests['abc-123'],
    );
  });

  it('selectSignatureRequestById returns undefined for an unknown id', () => {
    expect(
      selectSignatureRequestById(makeState(requests), 'does-not-exist'),
    ).toBeUndefined();
  });
});
