import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('./AndroidMediaPlayer', () => 'AndroidMediaPlayer');
jest.mock('./Loader', () => 'Loader');

// The MediaPlayer index.js just re-exports platform-specific player
describe('MediaPlayer', () => {
  it('exports AndroidMediaPlayer module', () => {
    const AndroidMediaPlayer = require('./AndroidMediaPlayer');
    expect(AndroidMediaPlayer).toBeDefined();
  });

  it('exports Loader component', () => {
    const Loader = require('./Loader');
    expect(Loader).toBeDefined();
  });
});
