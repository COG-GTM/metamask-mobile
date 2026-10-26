import migrate009 from './009';
import migrate010 from './010';
import migrate011 from './011';

const createState = () => ({
  engine: { backgroundState: { PreferencesController: { foo: 'bar' } } },
});

describe('Preferences migrations #009 - #011', () => {
  it('#009 enables the static token list', () => {
    expect(
      migrate009(createState()).engine.backgroundState.PreferencesController,
    ).toEqual({ foo: 'bar', useStaticTokenList: true });
  });

  it('#010 disables collectible detection and OpenSea', () => {
    expect(
      migrate010(createState()).engine.backgroundState.PreferencesController,
    ).toEqual({
      foo: 'bar',
      useCollectibleDetection: false,
      openSeaEnabled: false,
    });
  });

  it('#011 enables token detection', () => {
    expect(
      migrate011(createState()).engine.backgroundState.PreferencesController,
    ).toEqual({ foo: 'bar', useTokenDetection: true });
  });
});
