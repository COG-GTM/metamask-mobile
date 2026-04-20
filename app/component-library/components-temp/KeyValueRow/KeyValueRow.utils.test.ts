import React from 'react';
import { isPreDefinedKeyValueRowLabel } from './KeyValueRow.utils';

describe('isPreDefinedKeyValueRowLabel', () => {
  it('returns true when label is a pre-defined object with a text property', () => {
    expect(isPreDefinedKeyValueRowLabel({ text: 'Hello' })).toBe(true);
  });

  it('returns false when label is a string', () => {
    expect(isPreDefinedKeyValueRowLabel('Hello')).toBe(false);
  });

  it('returns false when label is a React element', () => {
    expect(
      isPreDefinedKeyValueRowLabel(React.createElement('span', null, 'hi')),
    ).toBe(false);
  });

  it('returns false when label is undefined', () => {
    expect(isPreDefinedKeyValueRowLabel(undefined)).toBe(false);
  });

  it('returns false when label is null', () => {
    expect(isPreDefinedKeyValueRowLabel(null)).toBe(false);
  });

  it('returns false when label object has no text property', () => {
    expect(isPreDefinedKeyValueRowLabel({ foo: 'bar' } as unknown as Parameters<typeof isPreDefinedKeyValueRowLabel>[0])).toBe(false);
  });
});
