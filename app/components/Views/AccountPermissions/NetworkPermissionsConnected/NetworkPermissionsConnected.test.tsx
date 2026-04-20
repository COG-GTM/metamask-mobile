import React from 'react';

jest.mock('../../../../component-library/components-temp/SheetActions', () => 'SheetActions');
jest.mock('../../../../components/UI/AccountSelectorList', () => 'AccountSelectorList');

describe('NetworkPermissionsConnected', () => {
  it('module exports correctly', () => {
    const mod = require('./NetworkPermissionsConnected');
    expect(mod).toBeDefined();
    expect(mod.default).toBeDefined();
  });
});
