import React from 'react';

jest.mock('../../../../components/UI/AccountSelectorList', () => 'AccountSelectorList');

describe('AccountConnectSingleSelector', () => {
  it('module exports correctly', () => {
    const mod = require('./AccountConnectSingleSelector');
    expect(mod).toBeDefined();
    expect(mod.default).toBeDefined();
  });
});
