import backgroundShapes from './backgroundShapes';

describe('backgroundShapes', () => {
  it('exports a non-empty SVG string', () => {
    expect(typeof backgroundShapes).toBe('string');
    expect(backgroundShapes.length).toBeGreaterThan(0);
  });

  it('is a valid SVG root element', () => {
    expect(backgroundShapes.trim().startsWith('<svg')).toBe(true);
    expect(backgroundShapes.trim().endsWith('</svg>')).toBe(true);
  });

  it('declares the SVG namespace', () => {
    expect(backgroundShapes).toContain('xmlns="http://www.w3.org/2000/svg"');
  });
});
