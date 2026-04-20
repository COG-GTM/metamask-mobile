import React from 'react';
import { render } from '@testing-library/react-native';
import { SnapUIImage } from './SnapUIImage';

describe('SnapUIImage', () => {
  it('renders an SVG with a viewBox', () => {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect /></svg>';
    const { toJSON } = render(<SnapUIImage value={svg} />);
    expect(toJSON()).toBeTruthy();
  });

  it('falls back to width/height attributes when there is no viewBox', () => {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="10"><rect /></svg>';
    const { toJSON } = render(<SnapUIImage value={svg} />);
    expect(JSON.stringify(toJSON())).toContain('aspectRatio');
  });

  it('uses explicit width/height props when passed', () => {
    const svg = '<svg viewBox="0 0 10 10"></svg>';
    const { toJSON } = render(
      <SnapUIImage value={svg} width={48} height={48} borderRadius={8} />,
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it('handles SVG without viewBox or width/height gracefully', () => {
    const { toJSON } = render(
      <SnapUIImage value="<svg></svg>" width={16} height={16} />,
    );
    expect(toJSON()).toBeTruthy();
  });
});
