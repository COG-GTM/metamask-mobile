# Team Coordination Plan

## JavaScript to TypeScript Migration

**Generated:** December 2024  
**Repository:** metamask-mobile  
**Scope:** app/ directory (333 JavaScript files)

---

## 1. Domain Ownership Assignments

Based on the `.github/CODEOWNERS` file, the following teams are responsible for specific areas of the codebase. Each team should own the TypeScript migration for their domain.

### Team Ownership Matrix

| Team | Domain | JS Files | Priority |
|------|--------|----------|----------|
| @MetaMask/design-system-engineers | Component Library | ~5 | Low (mostly TS) |
| @MetaMask/mobile-platform | Core Platform, Analytics, Migrations | ~60 | High |
| @MetaMask/confirmations | Confirmation Flows | ~30 | High |
| @MetaMask/sdk-devs | SDK, WalletConnect | ~15 | Medium |
| @MetaMask/swaps-engineers | Swaps, Bridge | ~20 | Medium |
| @MetaMask/metamask-assets | Assets, Collectibles, Tokens | ~25 | Medium |
| @MetaMask/wallet-ux | Settings, Onboarding, Account Views | ~30 | Medium |
| @MetaMask/ramp | Ramp Components | ~5 | Low |
| @MetaMask/notifications | Notifications | ~5 | Low |
| @MetaMask/wallet-api-platform-engineers | RPC Methods, Permissions | ~15 | High |
| @MetaMask/accounts-engineers | Encryptor, Accounts | ~5 | Medium |
| @MetaMask/snaps-devs | Snaps Integration | ~5 | Low |
| Unassigned | Utilities, Base Components, Other | ~113 | High |

---

## 2. Detailed Team Assignments

### @MetaMask/mobile-platform

**Primary Responsibilities:**
- `app/core/Analytics/` - Analytics utilities
- `app/util/metrics/` - Metrics utilities
- `app/store/migrations/` - State migrations (38 JS files)
- `app/core/Engine/` - Engine core (mostly TS)
- `app/core/NavigationService/` - Navigation service
- `app/core/DeeplinkManager/` - Deeplink handling
- `app/components/Nav/` - Navigation components (3 JS files)
- `app/components/Views/Root/` - Root view
- `app/components/Views/BrowserTab/` - Browser tab

**Key JS Files to Migrate:**
```
app/store/migrations/000.js through 027.js (28 files)
app/components/Nav/Main/MainNavigator.js
app/components/Nav/Main/RootRPCMethodsUI.js
app/components/Nav/Main/index.js
```

**Estimated Effort:** 2-3 weeks

---

### @MetaMask/confirmations

**Primary Responsibilities:**
- `app/components/Views/confirmations/` - All confirmation flows
- `app/core/Engine/controllers/gas-fee-controller/`
- `app/core/Engine/controllers/signature-controller/`
- `app/core/Engine/controllers/transaction-controller/`

**Key JS Files to Migrate:**
```
app/components/Views/confirmations/legacy/Approval/index.js
app/components/Views/confirmations/legacy/Approval/components/TransactionEditor/index.js
app/components/Views/confirmations/legacy/Approve/index.js
app/components/Views/confirmations/legacy/ApproveView/Approve/index.js
app/components/Views/confirmations/legacy/Send/index.js
app/components/Views/confirmations/legacy/SendFlow/AddressList/AddressList.jsx
app/components/Views/confirmations/legacy/SendFlow/Amount/index.js
app/components/Views/confirmations/legacy/SendFlow/Confirm/index.js
app/components/Views/confirmations/legacy/SendFlow/ErrorMessage/index.js
app/components/Views/confirmations/legacy/SendFlow/SendTo/index.js
app/components/Views/confirmations/legacy/components/ApproveTransactionReview/index.js
app/components/Views/confirmations/legacy/components/CustomNonce/index.js
app/components/Views/confirmations/legacy/components/EditGasFee1559Update/index.jsx
app/components/Views/confirmations/legacy/components/EditGasFeeLegacyUpdate/index.jsx
app/components/Views/confirmations/legacy/components/SignatureRequest/index.js
app/components/Views/confirmations/legacy/components/TransactionReview/index.js
app/components/Views/confirmations/legacy/components/TypedSign/index.js
app/components/Views/confirmations/legacy/components/WatchAssetRequest/index.js
```

**Estimated Effort:** 2-3 weeks

---

### @MetaMask/sdk-devs

**Primary Responsibilities:**
- `app/core/SDKConnect/` - SDK connection
- `app/core/WalletConnect/` - WalletConnect integration
- `app/core/BackgroundBridge/WalletConnectPort.ts`
- `app/core/RPCMethods/RPCMethodMiddleware.ts`
- `app/util/walletconnect.js`

**Key JS Files to Migrate:**
```
app/core/WalletConnect/WalletConnect.js
app/util/walletconnect.js
app/components/Views/WalletConnectSessions/index.js
```

**Estimated Effort:** 1 week

---

### @MetaMask/swaps-engineers

**Primary Responsibilities:**
- `app/components/UI/Swaps/` - Swap components
- `app/components/UI/Bridge/` - Bridge components

**Key JS Files to Migrate:**
```
app/components/UI/Swaps/QuotesView.js
app/components/UI/Swaps/index.js
app/components/UI/Swaps/components/ActionAlert.js
app/components/UI/Swaps/components/ApprovalTransactionEditionModal.js
app/components/UI/Swaps/components/AssetSwapButton.js
app/components/UI/Swaps/components/GasEditModal.js
app/components/UI/Swaps/components/LoadingAnimation/index.js
app/components/UI/Swaps/components/Onboarding.js
app/components/UI/Swaps/components/QuotesModal.js
app/components/UI/Swaps/components/QuotesSummary.js
app/components/UI/Swaps/components/SlippageModal.js
app/components/UI/Swaps/components/TokenIcon.js
app/components/UI/Swaps/components/TokenImportModal.js
app/components/UI/Swaps/components/TokenSelectButton.js
app/components/UI/Swaps/components/TokenSelectModal.js
app/components/UI/Swaps/utils/index.js
app/components/UI/Swaps/utils/useBalance.js
app/components/UI/Swaps/utils/useBlockExplorer.js
app/components/UI/Swaps/utils/useFetchTokenMetadata.js
```

**Estimated Effort:** 1-2 weeks

---

### @MetaMask/metamask-assets

**Primary Responsibilities:**
- `app/components/UI/AssetOverview/`
- `app/components/UI/Collectibles/`
- `app/components/UI/CollectibleContract*/`
- `app/components/UI/Tokens/`
- `app/components/Views/Asset/`
- `app/components/Views/Collectible/`
- `app/reducers/collectibles/`

**Key JS Files to Migrate:**
```
app/components/UI/Collectibles/index.js
app/components/UI/CollectibleContractElement/index.js
app/components/UI/CollectibleContractInformation/index.js
app/components/UI/CollectibleContractOverview/index.js
app/components/UI/CollectibleContracts/index.js
app/components/UI/CollectibleOverview/index.js
app/components/UI/AssetList/index.js
app/components/Views/Asset/index.js
app/components/Views/Collectible/index.js
app/components/Views/CollectibleView/index.js
app/reducers/collectibles/index.js
app/actions/collectibles/index.js
```

**Estimated Effort:** 1-2 weeks

---

### @MetaMask/wallet-ux

**Primary Responsibilities:**
- `app/components/Views/Settings/` - Settings views
- `app/components/Views/Onboarding/` - Onboarding flow
- `app/components/Views/Login/` - Login view
- `app/components/Views/LockScreen/` - Lock screen
- `app/reducers/settings/` - Settings reducer
- `app/reducers/onboarding/` - Onboarding reducer

**Key JS Files to Migrate:**
```
app/components/Views/Settings/AdvancedSettings/index.js
app/components/Views/Settings/AppInformation/index.js
app/components/Views/Settings/Contacts/ContactForm/index.js
app/components/Views/Settings/Contacts/index.js
app/components/Views/Settings/GeneralSettings/index.js
app/components/Views/Settings/NetworksSettings/NetworkSettings/index.js
app/components/Views/Settings/NetworksSettings/index.js
app/components/Views/Onboarding/index.js
app/components/Views/LockScreen/index.js
app/components/Views/ChoosePassword/index.js
app/components/Views/ResetPassword/index.js
app/reducers/settings/index.js
app/reducers/onboarding/index.js (if exists)
```

**Estimated Effort:** 1-2 weeks

---

### @MetaMask/wallet-api-platform-engineers

**Primary Responsibilities:**
- `app/core/RPCMethods/` - RPC method handling
- `app/util/permissions/` - Permission utilities
- `app/core/Permissions/` - Permission specifications

**Key JS Files to Migrate:**
```
app/core/RPCMethods/createEip1193MethodMiddleware/index.js
app/core/RPCMethods/eth-request-accounts.js
app/core/RPCMethods/handlers/index.js
app/core/RPCMethods/index.js
app/core/RPCMethods/lib/ethereum-chain-utils.js
app/core/RPCMethods/wallet_addEthereumChain.js
app/core/RPCMethods/wallet_switchEthereumChain.js
app/core/Permissions/specifications.js
```

**Estimated Effort:** 1-2 weeks

---

### Unassigned / Shared Ownership

**Files requiring cross-team coordination or general assignment:**

#### Utilities (32 files)
```
app/util/ENSUtils.js
app/util/blockies.js
app/util/confirm-tx.js
app/util/conversions.js
app/util/gasUtils.js
app/util/networks/index.js
app/util/transactions/index.js
... (see full list in migration-backlog.md)
```

#### Base Components (12 files)
```
app/components/Base/DetailsModal.js
app/components/Base/Keypad/*
app/components/Base/RangeInput.js
app/components/Base/RemoteImage/index.js
app/components/Base/StatusText.js
app/components/Base/TabBar.js
```

#### Core Systems (25 files)
```
app/core/BackgroundBridge/BackgroundBridge.js
app/core/ClipboardManager.js
app/core/DrawerStatusTracker.js
app/core/EntryScriptWeb3.js
app/core/InpageBridgeWeb3.js
app/core/MobilePortStream.js
app/core/NotificationManager.js
app/core/PreventScreenshot.js
app/core/SecureKeychain.js
app/core/TransactionTypes.js
app/core/Vault.js
```

#### Actions & Reducers (25 files)
```
app/actions/alert/index.js
app/actions/bookmarks/index.js
app/actions/browser/index.js
... (see full list in migration-backlog.md)
app/reducers/alert/index.js
app/reducers/bookmarks/index.js
app/reducers/browser/index.js
... (see full list in migration-backlog.md)
```

---

## 3. Weekly Sync Meeting Plan

### Meeting Structure

**Frequency:** Weekly  
**Duration:** 30 minutes  
**Day/Time:** [To be determined based on team availability]

### Agenda Template

1. **Progress Update (10 min)**
   - Files migrated since last meeting
   - PRs merged/pending review
   - Blockers encountered

2. **Cross-Team Dependencies (10 min)**
   - Shared type definitions needed
   - Interface changes affecting other teams
   - Breaking changes identified

3. **Planning (10 min)**
   - Next week's migration targets
   - Resource allocation
   - Risk mitigation

### Meeting Participants

- One representative from each team with assigned files
- Migration lead/coordinator
- Optional: Technical lead for complex issues

### Meeting Cadence by Phase

| Phase | Duration | Meeting Focus |
|-------|----------|---------------|
| Phase 1-3 | Weeks 1-2 | Quick wins, establish patterns |
| Phase 4-5 | Weeks 3-4 | Base components, migrations |
| Phase 6 | Weeks 5-7 | UI components (largest phase) |
| Phase 7 | Weeks 8-10 | Views |
| Phase 8-9 | Weeks 11-12 | Core systems, navigation |

---

## 4. Communication Plan

### Channels

| Channel | Purpose | Audience |
|---------|---------|----------|
| Slack #js-ts-migration | Daily updates, quick questions | All contributors |
| GitHub PR Reviews | Code review, technical discussion | Reviewers, authors |
| Weekly Sync | Progress tracking, blockers | Team leads |
| GitHub Issues | Bug tracking, feature requests | All contributors |

### Escalation Path

1. **Level 1:** Post in Slack channel for quick questions
2. **Level 2:** Create GitHub issue for tracked blockers
3. **Level 3:** Raise in weekly sync meeting
4. **Level 4:** Escalate to tech lead for critical blockers

### Blocker Categories

| Category | Response Time | Escalation |
|----------|---------------|------------|
| Type definition missing | 24 hours | Create shared type |
| Breaking change identified | 48 hours | Weekly sync |
| CI/Build failure | 4 hours | Immediate fix |
| Cross-team dependency | 48 hours | Coordinate in Slack |

---

## 5. Migration Blockers Handling

### Common Blockers and Solutions

#### 1. Missing Type Definitions

**Problem:** External package lacks TypeScript types  
**Solution:**
- Check DefinitelyTyped (`@types/package-name`)
- Create local declaration file in `app/declarations/`
- Use `declare module` for quick unblocking

#### 2. Circular Dependencies

**Problem:** TypeScript stricter about circular imports  
**Solution:**
- Identify cycles using dependency graph
- Extract shared types to separate file
- Refactor to break cycles

#### 3. PropTypes to Interface Mismatch

**Problem:** PropTypes don't map cleanly to TypeScript  
**Solution:**
- Document edge cases
- Create utility types for common patterns
- Use `unknown` temporarily, refine later

#### 4. Redux State Typing

**Problem:** Complex nested state structure  
**Solution:**
- Use existing `RootState` type
- Create typed selectors
- Reference `app/core/Engine/types.ts`

#### 5. Third-Party Component Props

**Problem:** Wrapped components lose type information  
**Solution:**
- Use `React.ComponentProps<typeof Component>`
- Create wrapper types
- Document in shared types file

### Blocker Resolution Process

```
1. Identify blocker
   ↓
2. Document in GitHub issue
   ↓
3. Tag relevant team(s)
   ↓
4. Propose solution
   ↓
5. Implement fix or workaround
   ↓
6. Update documentation
   ↓
7. Close issue
```

---

## 6. Quality Gates

### PR Requirements

- [ ] All TypeScript errors resolved (`yarn lint:tsc` passes)
- [ ] No `@ts-ignore` without justification comment
- [ ] PropTypes fully replaced with interfaces
- [ ] Tests updated/passing
- [ ] No new `any` types (use `unknown` if needed)
- [ ] Follows existing code conventions

### Review Checklist

- [ ] Types are accurate and complete
- [ ] Interfaces are exported for reuse
- [ ] No unnecessary type assertions
- [ ] Null handling is explicit
- [ ] Redux selectors are typed

### Merge Criteria

- [ ] At least one approval from domain owner
- [ ] CI checks passing
- [ ] No unresolved comments
- [ ] PR description updated

---

## 7. Progress Tracking

### Metrics to Track

| Metric | Target | Current |
|--------|--------|---------|
| Total JS files | 0 | 333 |
| Files migrated | 333 | 0 |
| PRs merged | - | 0 |
| Blockers open | 0 | 0 |
| Blockers resolved | - | 0 |

### Reporting

**Weekly Report Template:**
```
Week of [DATE]

Files Migrated: X
PRs Merged: X
PRs In Review: X
Blockers: X open, X resolved

Highlights:
- [Key accomplishments]

Challenges:
- [Issues encountered]

Next Week:
- [Planned work]
```

### Dashboard

Track progress using:
- GitHub Project Board (if available)
- `js-files-inventory.json` status updates
- Weekly sync meeting notes

---

## 8. Resources

### Documentation

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [MetaMask Mobile Contributing Guide](../CONTRIBUTING.md)

### Type References

- `app/core/Engine/types.ts` - Engine state types
- `app/declarations/` - Custom type declarations
- `@metamask/*` packages - Controller types

### Tools

- `yarn lint:tsc` - TypeScript type checking
- `yarn lint` - ESLint with TypeScript rules
- Inventory script: `scripts/js-ts-migration/inventory-js-files.js`

---

## 9. Timeline Summary

| Week | Phase | Focus | Teams |
|------|-------|-------|-------|
| 1 | 1 | Quick wins (mocks, constants) | All |
| 2 | 2-3 | Utilities, Actions, Reducers | Platform, Shared |
| 3 | 4-5 | Base components, Migrations | Platform, Shared |
| 4-5 | 6 | UI Components (batch 1) | Assets, Swaps |
| 6-7 | 6 | UI Components (batch 2-3) | All UI teams |
| 8-9 | 7 | Views (batch 1-2) | UX, Confirmations |
| 10 | 7 | Views (batch 3 - confirmations) | Confirmations |
| 11 | 8 | Core systems | Platform, SDK, API |
| 12 | 9 | Navigation, cleanup | Platform |

**Total Duration:** ~12 weeks (3 months)

---

## 10. Success Criteria

### Phase Completion

- [ ] Phase 1: All mocks, constants, test utils migrated
- [ ] Phase 2: All utilities migrated
- [ ] Phase 3: All actions and reducers migrated
- [ ] Phase 4: All base components migrated
- [ ] Phase 5: All store migrations migrated
- [ ] Phase 6: All UI components migrated
- [ ] Phase 7: All views migrated
- [ ] Phase 8: All core systems migrated
- [ ] Phase 9: All navigation migrated

### Project Completion

- [ ] Zero JavaScript files in `app/` directory
- [ ] All TypeScript strict mode errors resolved
- [ ] No `@ts-ignore` comments without justification
- [ ] All tests passing
- [ ] Documentation updated
- [ ] Team retrospective completed
