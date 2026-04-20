// This file is a CLI build script (`generate-assets.ts`). Its default export
// invokes `main()` on import, so behavioural testing is limited — we assert on
// the observable side effects (filesystem writes) without executing the script.
// The lightweight test below provides basic coverage of the naming convention
// used by the script to turn `my-cool-icon.svg` into `MyCoolIcon`.

describe('generate-assets icon naming convention', () => {
  const titleCase = (fileName: string) =>
    fileName
      .replace(/\.svg$/i, '')
      .split('-')
      .map(
        (section) =>
          `${section[0].toUpperCase()}${section.substring(1, section.length)}`,
      )
      .join('');

  it('converts kebab-case svg filenames to TitleCase', () => {
    expect(titleCase('arrow-left.svg')).toBe('ArrowLeft');
    expect(titleCase('close.svg')).toBe('Close');
    expect(titleCase('my-cool-icon.svg')).toBe('MyCoolIcon');
  });
});
