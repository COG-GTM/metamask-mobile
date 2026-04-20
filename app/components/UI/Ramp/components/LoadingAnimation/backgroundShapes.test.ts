import backgroundShapes from './backgroundShapes';

describe('backgroundShapes', () => {
  it('exports a valid SVG string with the expected root element', () => {
    expect(typeof backgroundShapes).toBe('string');
    expect(backgroundShapes).toContain('<svg');
    expect(backgroundShapes).toContain('</svg>');
    expect(backgroundShapes).toMatch(/id="bgShapes"/);
  });

  it('contains non-zero paths so consumers can render the shapes', () => {
    const pathCount = (backgroundShapes.match(/<path /g) ?? []).length;
    expect(pathCount).toBeGreaterThan(0);
  });
});
