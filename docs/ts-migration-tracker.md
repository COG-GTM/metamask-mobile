# TypeScript Migration Tracker

Companion to [`ts-migration-plan.md`](./ts-migration-plan.md). One row per slice; one slice = one agent = one branch = one PR.

**Claim protocol:** before starting a slice, open a PR that flips its status to `claimed` and adds your handle; land that PR (or at least push the branch) before touching any file in the slice. Flip to `done` in the migration PR itself.

Regenerate the remaining-files list at any time with `scripts/ts-migration/remaining-js.sh`.

## Slice status

| Slice | Wave | Scope                                                                                                                | Files | LOC  | Depends on     | Owner | Status |
| ----- | ---- | -------------------------------------------------------------------------------------------------------------------- | ----- | ---- | -------------- | ----- | ------ |
| A1    | A    | Redux actions                                                                                                        | 11    | 618  | -              |       | open   |
| A2    | A    | Constants, images, **mocks**                                                                                         | 10    | 232  | -              |       | open   |
| A3    | A    | lib/ens-ipfs                                                                                                         | 3     | 448  | -              |       | open   |
| A4    | A    | util root files (flat helpers)                                                                                       | 13    | 1819 | -              |       | open   |
| A5    | A    | util subdirectories (excluding transactions, test)                                                                   | 10    | 3131 | -              |       | open   |
| A6    | A    | util/transactions                                                                                                    | 1     | 1658 | -              |       | open   |
| A7    | A    | util/test (jest setup + fixtures)                                                                                    | 7     | 842  | -              |       | open   |
| A8    | A    | store/migrations 000-027 (+ tests)                                                                                   | 38    | 2338 | -              |       | open   |
| A9    | A    | core simple singletons                                                                                               | 6     | 202  | -              |       | open   |
| A10   | A    | core/Permissions                                                                                                     | 2     | 340  | -              |       | open   |
| A11   | A    | core/RPCMethods                                                                                                      | 10    | 1956 | -              |       | open   |
| B1    | B    | Redux reducers                                                                                                       | 14    | 1657 | A1             |       | open   |
| B2    | B    | core complex services (SecureKeychain, Vault, NotificationManager, BackgroundBridge, WalletConnect)                  | 6     | 2189 | A9             |       | open   |
| B3    | B    | components/Base                                                                                                      | 12    | 2007 | A4, A5         |       | open   |
| B4    | B    | UI: tiny presentational components                                                                                   | 39    | 4569 | A4, A5         |       | open   |
| B5a   | B    | UI: Swaps sub-components (Swaps/components/\*\*)                                                                     | 16    | 3394 | A4, A5, A6     |       | open   |
| B5b   | B    | UI: Swaps root (index, QuotesView, utils)                                                                            | 7     | 4494 | B5a            |       | open   |
| B6    | B    | UI: Transactions, TransactionElement, TransactionHeader, Notification                                                | 11    | 4708 | A6, B1         |       | open   |
| B7    | B    | UI: Navbar, NavbarTitle, NavbarBrowserTitle, DrawerView, Tabs, BrowserBottomBar                                      | 9     | 4416 | A4, A5, B1     |       | open   |
| B8    | B    | UI: Collectibles family + AddCustomToken + AccountOverview                                                           | 9     | 3642 | A4, A5         |       | open   |
| B9    | B    | UI: gas editors, payments, approval, onboarding, misc connected                                                      | 12    | 6193 | A4, A5, A6, B1 |       | open   |
| C1    | C    | Views: Settings                                                                                                      | 8     | 5280 | B4, B7         |       | open   |
| C2    | C    | Views: onboarding, backup, password, import flows                                                                    | 15    | 5499 | B4             |       | open   |
| C3    | C    | Views: legacy confirmations - Approval/Approve/Send containers                                                       | 5     | 4623 | B6, B9         |       | open   |
| C4    | C    | Views: legacy confirmations - SendFlow                                                                               | 9     | 4771 | B6, B9         |       | open   |
| C5a   | C    | Views: legacy confirmations - TransactionReview/\*\*                                                                 | 11    | 3551 | B6, B9         |       | open   |
| C5b   | C    | Views: legacy confirmations - other shared components (SignatureRequest, ApproveTransactionReview, gas editors, ...) | 12    | 4481 | B6, B9         |       | open   |
| C6    | C    | Views: Browser, Asset, Collectible, activity, misc screens                                                           | 20    | 4616 | B6, B7, B8     |       | open   |
| C7    | C    | Nav/Main (MainNavigator, RootRPCMethodsUI)                                                                           | 3     | 2079 | C1-C6          |       | open   |
| D1    | D    | index.js, shim.js                                                                                                    | 2     | -    | all of A-C     |       | open   |

Totals (in scope under `app/`): **329 files, 85753 LOC**. Status values: `open` | `claimed` | `in-review` | `done` | `blocked`.

## Per-file checklist

Tick a file when its PR merges. Test files (`*.test.js[x]`) are listed with their source slice and are migrated in the same PR as their source.

### A1 — Redux actions (11 files, 618 LOC)

- [ ] `app/actions/alert/index.js` (15)
- [ ] `app/actions/bookmarks/index.js` (13)
- [ ] `app/actions/browser/index.js` (135)
- [ ] `app/actions/collectibles/index.js` (26)
- [ ] `app/actions/infuraAvailability/index.js` (16)
- [ ] `app/actions/modals/index.js` (33)
- [ ] `app/actions/notification/index.js` (102)
- [ ] `app/actions/privacy/index.js` (20)
- [ ] `app/actions/settings/index.js` (76)
- [ ] `app/actions/transaction/index.js` (173)
- [ ] `app/actions/wizard/index.js` (9)

### A2 — Constants, images, **mocks** (10 files, 232 LOC)

- [ ] `app/__mocks__/pngMock.js` (3)
- [ ] `app/__mocks__/react-native-device-info.js` (7)
- [ ] `app/__mocks__/react-native-splash-screen.js` (10)
- [ ] `app/__mocks__/react-native-view-shot.js` (6)
- [ ] `app/__mocks__/rn-fetch-blob.js` (21)
- [ ] `app/__mocks__/svgMock.js` (2)
- [ ] `app/constants/navigation.js` (3)
- [ ] `app/constants/network.js` (105)
- [ ] `app/constants/onboarding.js` (17)
- [ ] `app/images/image-icons.js` (58)

### A3 — lib/ens-ipfs (3 files, 448 LOC)

- [ ] `app/lib/ens-ipfs/contracts/registry.js` (108)
- [ ] `app/lib/ens-ipfs/contracts/resolver.js` (235)
- [ ] `app/lib/ens-ipfs/resolver.js` (105)

### A4 — util root files (flat helpers) (13 files, 1819 LOC)

- [ ] `app/util/ENSUtils.js` (123)
- [ ] `app/util/blockies.js` (422)
- [ ] `app/util/confirm-tx.js` (167)
- [ ] `app/util/conversions.js` (237)
- [ ] `app/util/conversions.test.js` (12)
- [ ] `app/util/dapp-url-list.js` (482)
- [ ] `app/util/etherscan.js` (56)
- [ ] `app/util/gasUtils.js` (6)
- [ ] `app/util/middlewares.js` (117)
- [ ] `app/util/payment-link-generator.js` (77)
- [ ] `app/util/scaling.js` (64)
- [ ] `app/util/streams.js` (44)
- [ ] `app/util/walletconnect.js` (12)

### A5 — util subdirectories (excluding transactions, test) (10 files, 3131 LOC)

- [ ] `app/util/confirmation/signatureUtils.js` (144)
- [ ] `app/util/confusables/index.js` (34)
- [ ] `app/util/conversion/index.js` (284)
- [ ] `app/util/custom-gas/index.js` (150)
- [ ] `app/util/date/index.js` (88)
- [ ] `app/util/device/index.js` (97)
- [ ] `app/util/general/index.js` (192)
- [ ] `app/util/networks/index.js` (624)
- [ ] `app/util/number/index.js` (939)
- [ ] `app/util/sentry/utils.js` (579)

### A6 — util/transactions (1 files, 1658 LOC)

- [ ] `app/util/transactions/index.js` (1658)

### A7 — util/test (jest setup + fixtures) (7 files, 842 LOC)

- [ ] `app/util/test/contract-address-registry.js` (28)
- [ ] `app/util/test/ganache-seeder.js` (89)
- [ ] `app/util/test/ganache.js` (63)
- [ ] `app/util/test/network-store.js` (109)
- [ ] `app/util/test/smart-contracts.js` (68)
- [ ] `app/util/test/testSetup.js` (467)
- [ ] `app/util/test/utils.js` (18)

### A8 — store/migrations 000-027 (+ tests) (38 files, 2338 LOC)

- [ ] `app/store/migrations/000.js` (21)
- [ ] `app/store/migrations/001.js` (23)
- [ ] `app/store/migrations/002.js` (23)
- [ ] `app/store/migrations/003.js` (34)
- [ ] `app/store/migrations/004.js` (68)
- [ ] `app/store/migrations/005.js` (19)
- [ ] `app/store/migrations/006.js` (17)
- [ ] `app/store/migrations/007.js` (44)
- [ ] `app/store/migrations/008.js` (44)
- [ ] `app/store/migrations/009.js` (7)
- [ ] `app/store/migrations/010.js` (8)
- [ ] `app/store/migrations/011.js` (7)
- [ ] `app/store/migrations/012.js` (26)
- [ ] `app/store/migrations/013.js` (55)
- [ ] `app/store/migrations/014.js` (9)
- [ ] `app/store/migrations/015.js` (16)
- [ ] `app/store/migrations/016.js` (8)
- [ ] `app/store/migrations/017.js` (6)
- [ ] `app/store/migrations/018.js` (6)
- [ ] `app/store/migrations/019.js` (6)
- [ ] `app/store/migrations/019.test.js` (23)
- [ ] `app/store/migrations/020.js` (41)
- [ ] `app/store/migrations/020.test.js` (288)
- [ ] `app/store/migrations/021.js` (20)
- [ ] `app/store/migrations/021.test.js` (52)
- [ ] `app/store/migrations/022.js` (13)
- [ ] `app/store/migrations/022.test.js` (21)
- [ ] `app/store/migrations/023.js` (191)
- [ ] `app/store/migrations/023.test.js` (432)
- [ ] `app/store/migrations/024.js` (48)
- [ ] `app/store/migrations/024.test.js` (90)
- [ ] `app/store/migrations/025.js` (31)
- [ ] `app/store/migrations/025.test.js` (70)
- [ ] `app/store/migrations/026.js` (51)
- [ ] `app/store/migrations/026.test.js` (83)
- [ ] `app/store/migrations/027.js` (58)
- [ ] `app/store/migrations/027.test.js` (262)
- [ ] `app/store/migrations/028.test.js` (117)

### A9 — core simple singletons (6 files, 202 LOC)

- [ ] `app/core/ClipboardManager.js` (33)
- [ ] `app/core/DrawerStatusTracker.js` (33)
- [ ] `app/core/EntryScriptWeb3.js` (26)
- [ ] `app/core/MobilePortStream.js` (74)
- [ ] `app/core/PreventScreenshot.js` (20)
- [ ] `app/core/TransactionTypes.js` (16)

### A10 — core/Permissions (2 files, 340 LOC)

- [ ] `app/core/Permissions/specifications.js` (179)
- [ ] `app/core/Permissions/specifications.test.js` (161)

### A11 — core/RPCMethods (10 files, 1956 LOC)

- [ ] `app/core/RPCMethods/createEip1193MethodMiddleware/index.js` (17)
- [ ] `app/core/RPCMethods/createEip1193MethodMiddleware/index.test.js` (185)
- [ ] `app/core/RPCMethods/eth-request-accounts.js` (94)
- [ ] `app/core/RPCMethods/handlers/index.js` (4)
- [ ] `app/core/RPCMethods/index.js` (13)
- [ ] `app/core/RPCMethods/lib/ethereum-chain-utils.js` (365)
- [ ] `app/core/RPCMethods/wallet_addEthereumChain.js` (304)
- [ ] `app/core/RPCMethods/wallet_addEthereumChain.test.js` (544)
- [ ] `app/core/RPCMethods/wallet_switchEthereumChain.js` (127)
- [ ] `app/core/RPCMethods/wallet_switchEthereumChain.test.js` (303)

### B1 — Redux reducers (14 files, 1657 LOC)

- [ ] `app/reducers/alert/index.js` (28)
- [ ] `app/reducers/bookmarks/index.js` (11)
- [ ] `app/reducers/browser/index.js` (104)
- [ ] `app/reducers/browser/index.test.js` (69)
- [ ] `app/reducers/collectibles/index.js` (159)
- [ ] `app/reducers/infuraAvailability/index.js` (28)
- [ ] `app/reducers/modals/index.js` (62)
- [ ] `app/reducers/notification/index.js` (203)
- [ ] `app/reducers/notification/notification.test.js` (274)
- [ ] `app/reducers/privacy/index.js` (38)
- [ ] `app/reducers/settings/index.js` (70)
- [ ] `app/reducers/swaps/index.js` (421)
- [ ] `app/reducers/transaction/index.js` (168)
- [ ] `app/reducers/wizard/index.js` (22)

### B2 — core complex services (SecureKeychain, Vault, NotificationManager, BackgroundBridge, WalletConnect) (6 files, 2189 LOC)

- [ ] `app/core/BackgroundBridge/BackgroundBridge.js` (584)
- [ ] `app/core/BackgroundBridge/BackgroundBridge.test.js` (194)
- [ ] `app/core/NotificationManager.js` (523)
- [ ] `app/core/SecureKeychain.js` (212)
- [ ] `app/core/Vault.js` (170)
- [ ] `app/core/WalletConnect/WalletConnect.js` (506)

### B3 — components/Base (12 files, 2007 LOC)

- [ ] `app/components/Base/DetailsModal.js` (189)
- [ ] `app/components/Base/Keypad/Keypad.test.js` (34)
- [ ] `app/components/Base/Keypad/components.js` (117)
- [ ] `app/components/Base/Keypad/constants.js` (180)
- [ ] `app/components/Base/Keypad/createKeypadRule.js` (63)
- [ ] `app/components/Base/Keypad/createKeypadRule.test.js` (366)
- [ ] `app/components/Base/Keypad/index.js` (256)
- [ ] `app/components/Base/Keypad/useCurrency.js` (36)
- [ ] `app/components/Base/RangeInput.js` (285)
- [ ] `app/components/Base/RemoteImage/index.js` (318)
- [ ] `app/components/Base/StatusText.js` (120)
- [ ] `app/components/Base/TabBar.js` (43)

### B4 — UI: tiny presentational components (39 files, 4569 LOC)

- [ ] `app/components/UI/ActionModal/ActionContent/index.js` (206)
- [ ] `app/components/UI/ActionModal/index.js` (182)
- [ ] `app/components/UI/ActionView/index.js` (236)
- [ ] `app/components/UI/AnimatedSpinner/index.js` (136)
- [ ] `app/components/UI/AssetList/index.js` (95)
- [ ] `app/components/UI/BasicFunctionality/BasicFunctionality.test.js` (13)
- [ ] `app/components/UI/BasicFunctionality/BasicFunctionalityModal/BasicFunctionalityModal.test.js` (65)
- [ ] `app/components/UI/Button/index.js` (58)
- [ ] `app/components/UI/Confetti/index.js` (26)
- [ ] `app/components/UI/CustomAlert/index.js` (126)
- [ ] `app/components/UI/EthereumAddress/index.js` (72)
- [ ] `app/components/UI/FadeAnimationView/index.js` (133)
- [ ] `app/components/UI/FadeOutOverlay/index.js` (63)
- [ ] `app/components/UI/FoxScreen/index.js` (44)
- [ ] `app/components/UI/GlobalAlert/index.js` (156)
- [ ] `app/components/UI/HintModal/index.js` (132)
- [ ] `app/components/UI/ManageNetworks/ManageNetworks.test.js` (69)
- [ ] `app/components/UI/NetworkMainAssetLogo/index.js` (55)
- [ ] `app/components/UI/PhishingModal/index.js` (193)
- [ ] `app/components/UI/ProtectYourWalletModal/index.js` (209)
- [ ] `app/components/UI/Screen/index.js` (26)
- [ ] `app/components/UI/SeedphraseModal/index.js` (110)
- [ ] `app/components/UI/SelectComponent/index.js` (238)
- [ ] `app/components/UI/SettingsDrawer/index.js` (143)
- [ ] `app/components/UI/SettingsNotification/index.js` (110)
- [ ] `app/components/UI/SkipAccountSecurityModal/index.js` (163)
- [ ] `app/components/UI/SliderButton/index.js` (354)
- [ ] `app/components/UI/StyledButton/index.android.js` (147)
- [ ] `app/components/UI/StyledButton/index.ios.js` (104)
- [ ] `app/components/UI/StyledButton/index.js` (10)
- [ ] `app/components/UI/SwitchCustomNetwork/index.js` (73)
- [ ] `app/components/UI/TimeEstimateInfoModal/index.js` (52)
- [ ] `app/components/UI/TokenImage/index.js` (62)
- [ ] `app/components/UI/TransactionActionModal/TransactionActionContent/index.js` (119)
- [ ] `app/components/UI/TransactionActionModal/index.js` (103)
- [ ] `app/components/UI/WarningExistingUserModal/index.js` (117)
- [ ] `app/components/UI/WebsiteIcon/index.js` (167)
- [ ] `app/components/UI/WebviewError/index.js` (132)
- [ ] `app/components/UI/WebviewProgressBar/index.js` (70)

### B5a — UI: Swaps sub-components (Swaps/components/\*\*) (16 files, 3394 LOC)

- [ ] `app/components/UI/Swaps/components/ActionAlert.js` (157)
- [ ] `app/components/UI/Swaps/components/ApprovalTransactionEditionModal.js` (171)
- [ ] `app/components/UI/Swaps/components/AssetSwapButton.js` (71)
- [ ] `app/components/UI/Swaps/components/GasEditModal.js` (553)
- [ ] `app/components/UI/Swaps/components/LoadingAnimation/backgroundShapes.js` (61)
- [ ] `app/components/UI/Swaps/components/LoadingAnimation/index.js` (521)
- [ ] `app/components/UI/Swaps/components/Onboarding.js` (152)
- [ ] `app/components/UI/Swaps/components/QuotesModal.js` (510)
- [ ] `app/components/UI/Swaps/components/QuotesSummary.js` (122)
- [ ] `app/components/UI/Swaps/components/SlippageModal.js` (96)
- [ ] `app/components/UI/Swaps/components/TokenIcon.js` (173)
- [ ] `app/components/UI/Swaps/components/TokenIcon.test.js` (35)
- [ ] `app/components/UI/Swaps/components/TokenImportModal.js` (133)
- [ ] `app/components/UI/Swaps/components/TokenSelectButton.js` (34)
- [ ] `app/components/UI/Swaps/components/TokenSelectButton.test.js` (36)
- [ ] `app/components/UI/Swaps/components/TokenSelectModal.js` (569)

### B5b — UI: Swaps root (index, QuotesView, utils) (7 files, 4494 LOC)

- [ ] `app/components/UI/Swaps/QuotesView.js` (2676)
- [ ] `app/components/UI/Swaps/index.js` (1061)
- [ ] `app/components/UI/Swaps/utils/index.js` (273)
- [ ] `app/components/UI/Swaps/utils/index.test.js` (247)
- [ ] `app/components/UI/Swaps/utils/useBalance.js` (50)
- [ ] `app/components/UI/Swaps/utils/useBlockExplorer.js` (130)
- [ ] `app/components/UI/Swaps/utils/useFetchTokenMetadata.js` (57)

### B6 — UI: Transactions, TransactionElement, TransactionHeader, Notification (11 files, 4708 LOC)

- [ ] `app/components/UI/Notification/BaseNotification/index.js` (222)
- [ ] `app/components/UI/Notification/BaseNotification/index.test.jsx` (46)
- [ ] `app/components/UI/Notification/SimpleNotification/index.js` (62)
- [ ] `app/components/UI/Notification/TransactionNotification/index.js` (466)
- [ ] `app/components/UI/Notification/index.js` (128)
- [ ] `app/components/UI/TransactionElement/TransactionDetails/index.js` (533)
- [ ] `app/components/UI/TransactionElement/index.js` (724)
- [ ] `app/components/UI/TransactionElement/utils.js` (988)
- [ ] `app/components/UI/TransactionElement/utils.test.js` (329)
- [ ] `app/components/UI/TransactionHeader/index.js` (248)
- [ ] `app/components/UI/Transactions/index.js` (962)

### B7 — UI: Navbar, NavbarTitle, NavbarBrowserTitle, DrawerView, Tabs, BrowserBottomBar (9 files, 4416 LOC)

- [ ] `app/components/UI/BrowserBottomBar/index.js` (220)
- [ ] `app/components/UI/DrawerView/index.js` (1299)
- [ ] `app/components/UI/Navbar/index.js` (2047)
- [ ] `app/components/UI/Navbar/index.test.jsx` (48)
- [ ] `app/components/UI/NavbarBrowserTitle/index.js` (172)
- [ ] `app/components/UI/NavbarTitle/index.js` (185)
- [ ] `app/components/UI/NavbarTitle/index.test.js` (20)
- [ ] `app/components/UI/Tabs/TabCountIcon/index.js` (68)
- [ ] `app/components/UI/Tabs/index.js` (357)

### B8 — UI: Collectibles family + AddCustomToken + AccountOverview (9 files, 3642 LOC)

- [ ] `app/components/UI/AccountInfoCard/index.js` (257)
- [ ] `app/components/UI/AccountOverview/index.js` (472)
- [ ] `app/components/UI/AddCustomToken/index.js` (758)
- [ ] `app/components/UI/CollectibleContractElement/index.js` (319)
- [ ] `app/components/UI/CollectibleContractInformation/index.js` (236)
- [ ] `app/components/UI/CollectibleContractOverview/index.js` (178)
- [ ] `app/components/UI/CollectibleContracts/index.js` (615)
- [ ] `app/components/UI/CollectibleOverview/index.js` (571)
- [ ] `app/components/UI/Collectibles/index.js` (236)

### B9 — UI: gas editors, payments, approval, onboarding, misc connected (12 files, 6193 LOC)

- [ ] `app/components/UI/AccountApproval/index.js` (425)
- [ ] `app/components/UI/AddressInputs/index.js` (636)
- [ ] `app/components/UI/AddressInputs/index.test.jsx` (118)
- [ ] `app/components/UI/AnimatedTransactionModal/index.js` (297)
- [ ] `app/components/UI/EditGasFee1559/index.js` (1006)
- [ ] `app/components/UI/EditGasFeeLegacy/index.js` (626)
- [ ] `app/components/UI/OnboardingWizard/Coachmark/index.js` (439)
- [ ] `app/components/UI/OptinMetrics/index.js` (698)
- [ ] `app/components/UI/PaymentRequest/index.js` (906)
- [ ] `app/components/UI/PaymentRequestSuccess/index.js` (421)
- [ ] `app/components/UI/ReceiveRequest/index.js` (297)
- [ ] `app/components/UI/SlippageSlider/index.js` (324)

### C1 — Views: Settings (8 files, 5280 LOC)

- [ ] `app/components/Views/Settings/AdvancedSettings/index.js` (535)
- [ ] `app/components/Views/Settings/AppInformation/index.js` (241)
- [ ] `app/components/Views/Settings/Contacts/ContactForm/index.js` (513)
- [ ] `app/components/Views/Settings/Contacts/index.js` (185)
- [ ] `app/components/Views/Settings/GeneralSettings/index.js` (543)
- [ ] `app/components/Views/Settings/NetworksSettings/NetworkSettings/index.js` (2596)
- [ ] `app/components/Views/Settings/NetworksSettings/NetworkSettings/withIsOriginalNativeToken.js` (29)
- [ ] `app/components/Views/Settings/NetworksSettings/index.js` (638)

### C2 — Views: onboarding, backup, password, import flows (15 files, 5499 LOC)

- [ ] `app/components/Views/AccountBackupStep1/index.js` (320)
- [ ] `app/components/Views/AccountBackupStep1B/index.js` (399)
- [ ] `app/components/Views/ChoosePassword/index.js` (778)
- [ ] `app/components/Views/EnterPasswordSimple/index.js` (170)
- [ ] `app/components/Views/GasEducationCarousel/index.js` (419)
- [ ] `app/components/Views/ImportFromSecretRecoveryPhrase/index.js` (647)
- [ ] `app/components/Views/ImportPrivateKeySuccess/index.js` (161)
- [ ] `app/components/Views/LockScreen/index.js` (262)
- [ ] `app/components/Views/ManualBackupStep1/index.js` (328)
- [ ] `app/components/Views/ManualBackupStep2/index.js` (301)
- [ ] `app/components/Views/ManualBackupStep3/index.js` (242)
- [ ] `app/components/Views/Onboarding/index.js` (510)
- [ ] `app/components/Views/OnboardingSuccess/index.test.js` (79)
- [ ] `app/components/Views/ResetPassword/index.js` (816)
- [ ] `app/components/Views/TermsAndConditions/index.js` (67)

### C3 — Views: legacy confirmations - Approval/Approve/Send containers (5 files, 4623 LOC)

- [ ] `app/components/Views/confirmations/legacy/Approval/components/TransactionEditor/index.js` (992)
- [ ] `app/components/Views/confirmations/legacy/Approval/index.js` (781)
- [ ] `app/components/Views/confirmations/legacy/Approve/index.js` (1003)
- [ ] `app/components/Views/confirmations/legacy/ApproveView/Approve/index.js` (1004)
- [ ] `app/components/Views/confirmations/legacy/Send/index.js` (843)

### C4 — Views: legacy confirmations - SendFlow (9 files, 4771 LOC)

- [ ] `app/components/Views/confirmations/legacy/SendFlow/AddressList/AddressList.jsx` (252)
- [ ] `app/components/Views/confirmations/legacy/SendFlow/AddressList/index.js` (1)
- [ ] `app/components/Views/confirmations/legacy/SendFlow/Amount/index.js` (1602)
- [ ] `app/components/Views/confirmations/legacy/SendFlow/Confirm/components/CustomGasModal/CustomGasModal.jsx` (188)
- [ ] `app/components/Views/confirmations/legacy/SendFlow/Confirm/components/CustomGasModal/index.js` (1)
- [ ] `app/components/Views/confirmations/legacy/SendFlow/Confirm/index.js` (1655)
- [ ] `app/components/Views/confirmations/legacy/SendFlow/ErrorMessage/index.js` (66)
- [ ] `app/components/Views/confirmations/legacy/SendFlow/SendTo/index.js` (738)
- [ ] `app/components/Views/confirmations/legacy/SendFlow/components/CustomNonceModal/index.js` (268)

### C5a — Views: legacy confirmations - TransactionReview/\*\* (11 files, 3551 LOC)

- [ ] `app/components/Views/confirmations/legacy/components/TransactionReview/TransactionReviewData/index.js` (200)
- [ ] `app/components/Views/confirmations/legacy/components/TransactionReview/TransactionReviewDetailsCard/index.js` (209)
- [ ] `app/components/Views/confirmations/legacy/components/TransactionReview/TransactionReviewDetailsCard/index.test.js` (25)
- [ ] `app/components/Views/confirmations/legacy/components/TransactionReview/TransactionReviewEIP1559/index.js` (454)
- [ ] `app/components/Views/confirmations/legacy/components/TransactionReview/TransactionReviewEIP1559Update/index.jsx` (460)
- [ ] `app/components/Views/confirmations/legacy/components/TransactionReview/TransactionReviewEIP1559Update/index.test.jsx` (103)
- [ ] `app/components/Views/confirmations/legacy/components/TransactionReview/TransactionReviewEIP1559Update/styles.js` (52)
- [ ] `app/components/Views/confirmations/legacy/components/TransactionReview/TransactionReviewInformation/index.js` (783)
- [ ] `app/components/Views/confirmations/legacy/components/TransactionReview/TransactionReviewSummary/index.js` (163)
- [ ] `app/components/Views/confirmations/legacy/components/TransactionReview/index.js` (751)
- [ ] `app/components/Views/confirmations/legacy/components/TransactionReview/index.test.jsx` (351)

### C5b — Views: legacy confirmations - other shared components (SignatureRequest, ApproveTransactionReview, gas editors, ...) (12 files, 4481 LOC)

- [ ] `app/components/Views/confirmations/legacy/components/Approval/ApprovalFlowLoader/index.js` (53)
- [ ] `app/components/Views/confirmations/legacy/components/ApproveTransactionReview/index.js` (1392)
- [ ] `app/components/Views/confirmations/legacy/components/ApproveTransactionReview/index.test.jsx` (237)
- [ ] `app/components/Views/confirmations/legacy/components/CustomNonce/index.js` (57)
- [ ] `app/components/Views/confirmations/legacy/components/EditGasFee1559Update/index.jsx` (793)
- [ ] `app/components/Views/confirmations/legacy/components/EditGasFeeLegacyUpdate/index.jsx` (420)
- [ ] `app/components/Views/confirmations/legacy/components/SignatureRequest/ExpandedMessage/index.js` (137)
- [ ] `app/components/Views/confirmations/legacy/components/SignatureRequest/index.js` (411)
- [ ] `app/components/Views/confirmations/legacy/components/TypedSign/index.js` (315)
- [ ] `app/components/Views/confirmations/legacy/components/UpdateEIP1559Tx/index.jsx` (269)
- [ ] `app/components/Views/confirmations/legacy/components/WatchAssetRequest/index.js` (252)
- [ ] `app/components/Views/confirmations/mock-data.js` (145)

### C6 — Views: Browser, Asset, Collectible, activity, misc screens (20 files, 4616 LOC)

- [ ] `app/components/Views/ActivityView/index.js` (232)
- [ ] `app/components/Views/AddBookmark/index.js` (179)
- [ ] `app/components/Views/AddressQRCode/index.js` (189)
- [ ] `app/components/Views/Asset/index.js` (620)
- [ ] `app/components/Views/Asset/index.test.js` (197)
- [ ] `app/components/Views/Browser/index.js` (513)
- [ ] `app/components/Views/Collectible/index.js` (183)
- [ ] `app/components/Views/CollectibleView/index.js` (139)
- [ ] `app/components/Views/ErrorBoundary/index.js` (516)
- [ ] `app/components/Views/MediaPlayer/AndroidMediaPlayer.js` (654)
- [ ] `app/components/Views/MediaPlayer/index.js` (195)
- [ ] `app/components/Views/NavigationUnitTest/TestScreen1.test.js` (12)
- [ ] `app/components/Views/NavigationUnitTest/TestScreen2.test.js` (12)
- [ ] `app/components/Views/NavigationUnitTest/TestScreen3.test.js` (10)
- [ ] `app/components/Views/NavigationUnitTest/index.js` (70)
- [ ] `app/components/Views/OfflineMode/index.js` (124)
- [ ] `app/components/Views/SimpleWebview/index.js` (65)
- [ ] `app/components/Views/TransactionSummary/index.js` (159)
- [ ] `app/components/Views/TransactionsView/index.js` (259)
- [ ] `app/components/Views/WalletConnectSessions/index.js` (288)

### C7 — Nav/Main (MainNavigator, RootRPCMethodsUI) (3 files, 2079 LOC)

- [ ] `app/components/Nav/Main/MainNavigator.js` (911)
- [ ] `app/components/Nav/Main/RootRPCMethodsUI.js` (604)
- [ ] `app/components/Nav/Main/index.js` (564)

### D1 — top-level entry files

- [ ] `index.js`
- [ ] `shim.js`

## Explicitly out of scope (stay JavaScript)

- `app/lib/ppom/blockaid-version.js` — minified generated bundle (coverage-ignored); keep as-is
- `app/util/test/assetFileTransformer.js` — jest `transform` entry loaded directly by Node (not babel-transformed); must stay JS
- `babel.config.js`, `babel.config.tests.js`, `metro.config.js`, `metro.transform.js`, `jest.config.js`, `react-native.config.js`, `app.config.js`, `.eslintrc.js`, `.prettierrc.js`, `.detoxrc.js`, `wdio.conf.js` — Node-loaded tool configs
- `android/`, `ios/` — native code
- `patches/`, `node_modules/`, `ppom/` — vendored / generated
- `e2e/` (356 JS files), `wdio/` (124), `.storybook/`, `scripts/`, `.github/` (1031, mostly vendored action bundles) — test harnesses and tooling; a separate effort if ever
