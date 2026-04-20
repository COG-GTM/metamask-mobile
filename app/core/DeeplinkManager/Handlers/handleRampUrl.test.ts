import handleRampUrl from './handleRampUrl';
import handleRampUrlFromRamp from '../../../components/UI/Ramp/deeplink/handleRampUrl';

describe('handleRampUrl (DeeplinkManager re-export)', () => {
  it('re-exports the handleRampUrl implementation from Ramp/deeplink', () => {
    expect(handleRampUrl).toBe(handleRampUrlFromRamp);
    expect(typeof handleRampUrl).toBe('function');
  });
});
