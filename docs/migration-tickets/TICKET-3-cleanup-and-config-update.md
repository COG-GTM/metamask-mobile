# TICKET-3: Migrate Remaining Scripts and Update Build Configuration Post-Migration

**Type:** Story
**Priority:** Low
**Story Points:** 3
**Labels:** typescript-migration, tech-debt, configuration

## Description
Migrate remaining miscellaneous JavaScript files (scripts, ppom, storybook) to TypeScript and update build/lint configuration to reflect the completed migration. This ticket should be done AFTER Tickets 1 and 2 are complete.

### Scope

#### Scripts & Misc Files
- `scripts/metamask-bot-build-announce-bitrise.js` → `.ts`
- `scripts/start-api-logging-server.js` → `.ts`
- `scripts/testrail/testrail.api.js` → `.ts`
- `scripts/inpage-bridge/src/*.js` → `.ts`
- `ppom/src/*.js` → `.ts`
- `locales/update-script.js` → `.ts`
- `.storybook/index.js` → `.ts`
- `.storybook/storybook-store.js` → `.ts`
- `.storybook/storybook.requires.js` → `.ts`

#### Configuration Updates
1. **`tsconfig.json`** (line 9): Change `"allowJs": true` to `"allowJs": false` to enforce TypeScript-only codebase
2. **`.eslintrc.js`** (lines 42-61): Remove the JS-specific parser override block that configures `@babel/eslint-parser` for `*.js` and `*.jsx` files, since those file types will no longer exist in the app source
3. Verify no remaining `.js`/`.jsx` files exist outside of the explicitly excluded config files

### Files to NOT touch (must remain JS forever)
- `index.js` — React Native entry point
- `shim.js` — polyfill shim
- `babel.config.js`, `babel.config.tests.js` — Babel config
- `jest.config.js` — Jest config
- `metro.config.js`, `metro.transform.js` — Metro bundler
- `.eslintrc.js`, `.prettierrc.js`, `.detoxrc.js` — Linter/formatter configs
- `react-native.config.js` — RN CLI config
- `app.config.js` — Expo config
- `wdio.conf.js` — WebDriverIO config
- `ppom/webpack.config.*.js` — Webpack configs
- `ppom/.eslintrc.js`
- `scripts/inpage-bridge/webpack.config.js`

## Acceptance Criteria
- [ ] All script files migrated to TypeScript
- [ ] Storybook files migrated to TypeScript
- [ ] `tsconfig.json` updated: `allowJs` set to `false`
- [ ] `.eslintrc.js` updated: JS-specific parser override removed (lines 42-61)
- [ ] Full build succeeds (`yarn build` or equivalent)
- [ ] `npx tsc --noEmit` passes
- [ ] Full test suite passes (`yarn test`)
- [ ] ESLint passes across the entire codebase
- [ ] Only explicitly excluded config files remain as `.js`
