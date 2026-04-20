import React from 'react';

describe('Toast', () => {
  it('module exports correctly', () => {
    const mod = require('./Toast');
    expect(mod).toBeDefined();
  });

  it('Toast context exports correctly', () => {
    const mod = require('./Toast.context');
    expect(mod).toBeDefined();
  });
});
