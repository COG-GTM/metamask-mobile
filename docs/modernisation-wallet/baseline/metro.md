# Metro production Android bundle: legacy baseline

Command: `npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output /tmp/legacy.bundle`
(`.js.env` was copied from `.js.env.example`.)

| Attempt | Environment | Exit | Result |
|---|---|---|---|
| 1 (baseline as checked out) | fresh VM | 1 | `Unable to resolve module ./ppom.html.js from app/lib/ppom/PPOMView.tsx` ([log](metro-output-legacy.txt)) |
| 2 | + `cd ppom && yarn install --frozen-lockfile && yarn build` (the `yarn setup` "Build PPOM" step, gitignored output) | 1 | `Unable to resolve module ./termsOfUseContent from app/util/termsOfUse/termsOfUse.ts` ([log](metro-output-after-ppom.txt)) |
| 3 | + the `yarn setup` "Generate Terms of Use" step (gitignored `app/util/termsOfUse/termsOfUseContent.ts`) | 1 | ``While trying to resolve module `multiformats` from node_modules/@metamask/assets-controllers/dist/assetsUtil.cjs ... specifies a `main` module field that could not be resolved (.../multiformats/index)`` ([log](metro-output-after-ppom-and-terms.txt)) |

Conclusion: no production JS bundle can be built from the legacy baseline in this environment. The blocker is a dependency/Metro resolution problem in `node_modules` (the `multiformats` package exports), not reducer code. After attempt 3 the generated files were deleted again, so the Jest baseline environment stays the same as the fresh VM.
Gate for tickets: the migrated code must fail Metro with the same error or succeed. It must not introduce a new resolution error in an `app/reducers` or `app/actions` module.
