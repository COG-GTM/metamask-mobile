import { assetByIconName } from './Icon.assets';
import { IconName } from './Icon.types';

describe('assetByIconName', () => {
  it('is defined and is an object map', () => {
    expect(assetByIconName).toBeDefined();
    expect(typeof assetByIconName).toBe('object');
  });

  it('provides an asset for every IconName value', () => {
    const iconNames = Object.values(IconName);
    iconNames.forEach((name) => {
      expect(assetByIconName[name]).toBeDefined();
    });
  });

  it('exposes at least one known icon asset', () => {
    expect(assetByIconName[IconName.Add]).toBeDefined();
    expect(assetByIconName[IconName.ArrowLeft]).toBeDefined();
    expect(assetByIconName[IconName.Close]).toBeDefined();
  });
});
