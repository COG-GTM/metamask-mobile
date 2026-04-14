import PreventScreenshot from './PreventScreenshot';

describe('PreventScreenshot', () => {
  it('should export forbid function', () => {
    expect(typeof PreventScreenshot.forbid).toBe('function');
  });

  it('should export allow function', () => {
    expect(typeof PreventScreenshot.allow).toBe('function');
  });
});
