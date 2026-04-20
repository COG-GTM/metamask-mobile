import React from 'react';
import { render } from '@testing-library/react-native';
import { View, Text } from 'react-native';

jest.mock('./foundation/BottomSheetOverlay/BottomSheetOverlay', () => 'BottomSheetOverlay');
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    goBack: jest.fn(),
    addListener: jest.fn(() => jest.fn()),
  }),
}));

describe('BottomSheet', () => {
  it('module exports correctly', () => {
    const mod = require('./BottomSheet');
    expect(mod).toBeDefined();
  });
});
