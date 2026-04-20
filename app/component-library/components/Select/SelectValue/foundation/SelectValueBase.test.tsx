import React from 'react';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';

describe('SelectValueBase', () => {
  it('module exports correctly', () => {
    const mod = require('./SelectValueBase');
    expect(mod).toBeDefined();
  });
});
