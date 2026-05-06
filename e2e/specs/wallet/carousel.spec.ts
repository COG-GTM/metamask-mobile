'use strict';
import { Regression } from '../../tags';
import TestHelpers from '../../helpers';
import { loginToApp } from '../../viewHelper';
import FixtureBuilder from '../../fixtures/fixture-builder';
import {
  loadFixture,
  startFixtureServer,
  stopFixtureServer,
} from '../../fixtures/fixture-helper';
import { getFixturesServerPort } from '../../fixtures/utils';
import FixtureServer from '../../fixtures/fixture-server';
import Assertions from '../../utils/Assertions';
import WalletView from '../../pages/wallet/WalletView';
import Gestures from '../../utils/Gestures';

const fixtureServer = new FixtureServer();

describe(Regression('Carousel Tests'), () => {
  beforeAll(async () => {
    await TestHelpers.reverseServerPort();
    const fixture = new FixtureBuilder().build();
    await startFixtureServer(fixtureServer);
    await loadFixture(fixtureServer, { fixture });
    await TestHelpers.launchApp({
      launchArgs: { fixtureServerPort: `${getFixturesServerPort()}` },
    });
    await loginToApp();
  });
  beforeEach(async () => {
    jest.setTimeout(150000);
    const carouselContainer = await WalletView.carouselContainer;
    await Assertions.checkIfVisible((carouselContainer as unknown as Promise<Detox.IndexableNativeElement | Detox.NativeElement | Detox.IndexableSystemElement>), 5000);
  });
  afterAll(async () => {
    await stopFixtureServer(fixtureServer);
  });

  it('should display carousel with correct slides', async () => {
    const carouselContainer = await WalletView.carouselContainer;
    const carouselFirstSlide = await WalletView.carouselFirstSlide;
    const carouselFirstSlideTitle = await WalletView.carouselFirstSlideTitle;
    const carouselProgressDots = await WalletView.carouselProgressDots;
    await Assertions.checkIfVisible((carouselContainer as unknown as Promise<Detox.IndexableNativeElement | Detox.NativeElement | Detox.IndexableSystemElement>), 5000);
    await Assertions.checkIfVisible((carouselFirstSlide as unknown as Promise<Detox.IndexableNativeElement | Detox.NativeElement | Detox.IndexableSystemElement>), 5000);
    await Assertions.checkIfElementToHaveText(
      (carouselFirstSlideTitle as unknown as Promise<Detox.IndexableNativeElement>),
      'MetaMask Card',
      5000,
    );
    await Assertions.checkIfVisible((carouselProgressDots as unknown as Promise<Detox.IndexableNativeElement | Detox.NativeElement | Detox.IndexableSystemElement>), 5000);
  });
  it('should navigate between slides', async () => {
    const carouselContainer = await WalletView.carouselContainer;
    const carouselSecondSlide = await WalletView.carouselSecondSlide;
    const carouselSecondSlideTitle = await WalletView.carouselSecondSlideTitle;
    const carouselFirstSlideTitle = await WalletView.carouselFirstSlideTitle;
    await Gestures.swipe((carouselContainer as unknown as Promise<Detox.IndexableNativeElement>), 'left', 'slow', 0.7);
    await Assertions.checkIfVisible((carouselSecondSlide as unknown as Promise<Detox.IndexableNativeElement | Detox.NativeElement | Detox.IndexableSystemElement>), 5000);
    await Assertions.checkIfElementToHaveText(
      (carouselSecondSlideTitle as unknown as Promise<Detox.IndexableNativeElement>),
      'Fund your wallet',
      5000,
    );
    await Gestures.swipe((carouselContainer as unknown as Promise<Detox.IndexableNativeElement>), 'right', 'slow', 0.7);
    await Assertions.checkIfElementToHaveText(
      (carouselFirstSlideTitle as unknown as Promise<Detox.IndexableNativeElement>),
      'MetaMask Card',
      5000,
    );
  });
  it('should dismiss a slide', async () => {
    await device.disableSynchronization();
    const carouselSecondSlideTitle = await WalletView.carouselSecondSlideTitle;
    const firstSlideCloseButton =
      await WalletView.carouselFirstSlideCloseButton;
    await Assertions.checkIfVisible((firstSlideCloseButton as unknown as Promise<Detox.IndexableNativeElement | Detox.NativeElement | Detox.IndexableSystemElement>), 5000);
    await Gestures.waitAndTap((firstSlideCloseButton as unknown as Promise<Detox.IndexableNativeElement | Detox.SystemElement>));
    await TestHelpers.delay(5000);
    await Assertions.checkIfElementToHaveText(
      (carouselSecondSlideTitle as unknown as Promise<Detox.IndexableNativeElement>),
      'Fund your wallet',
      5000,
    );
    await device.enableSynchronization();
  });
  it('should handle slide interactions', async () => {
    await device.disableSynchronization();
    const carouselSecondSlide = await WalletView.carouselSecondSlide;
    await Assertions.checkIfVisible((carouselSecondSlide as unknown as Promise<Detox.IndexableNativeElement | Detox.NativeElement | Detox.IndexableSystemElement>), 5000);
    await Gestures.waitAndTap((carouselSecondSlide as unknown as Promise<Detox.IndexableNativeElement | Detox.SystemElement>));
    // await Assertions.checkIfVisible(container, 5000);
    // await TestHelpers.delay(5000);
    // await device.enableSynchronization();
  });
});
