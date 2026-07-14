'use strict';

// Regression spec for COG-852:
// SecureKeychain.getGenericPassword must return null safely when the keychain
// has no stored credentials instead of throwing a TypeError that crashes the
// app during launch / wallet unlock. This spec exercises the launch + unlock
// golden path and asserts the app reaches the wallet without crashing.
import { SmokeWalletPlatform } from '../tags';
import TestHelpers from '../helpers';
import { loginToApp } from '../viewHelper';
import FixtureBuilder from '../fixtures/fixture-builder';
import {
  loadFixture,
  startFixtureServer,
  stopFixtureServer,
} from '../fixtures/fixture-helper';
import { getFixturesServerPort } from '../fixtures/utils';
import FixtureServer from '../fixtures/fixture-server';
import Assertions from '../utils/Assertions';
import LoginView from '../pages/wallet/LoginView';
import WalletView from '../pages/wallet/WalletView';

const fixtureServer = new FixtureServer();

describe(
  SmokeWalletPlatform('SecureKeychain unlock does not crash (COG-852)'),
  () => {
    beforeAll(async () => {
      jest.setTimeout(150000);
      await TestHelpers.reverseServerPort();
      const fixture = new FixtureBuilder().build();
      await startFixtureServer(fixtureServer);
      await loadFixture(fixtureServer, { fixture });
      await TestHelpers.launchApp({
        launchArgs: { fixtureServerPort: `${getFixturesServerPort()}` },
      });
    });

    afterAll(async () => {
      await stopFixtureServer(fixtureServer);
    });

    it('reaches the login screen on launch without crashing', async () => {
      await Assertions.checkIfVisible(LoginView.container);
      await Assertions.checkIfVisible(LoginView.passwordInput);
    });

    it('unlocks the wallet without crashing', async () => {
      await loginToApp();
      await Assertions.checkIfVisible(WalletView.container);
    });
  },
);
