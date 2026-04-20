describe('Toast.context', () => {
  it('module exports correctly', () => {
    const mod = require('./Toast.context');
    expect(mod).toBeDefined();
  });

  it('exports ToastContextWrapper', () => {
    const mod = require('./Toast.context');
    expect(mod.ToastContextWrapper).toBeDefined();
  });
});
