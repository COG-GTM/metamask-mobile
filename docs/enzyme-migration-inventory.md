# Enzyme to React Testing Library Migration Inventory

This document provides a comprehensive inventory of all test files currently using Enzyme in the MetaMask Mobile codebase, along with complexity categorization and migration effort estimates.

## Executive Summary

| Metric | Count |
|--------|-------|
| Total test files in `app/` | 1,667 |
| Files using Enzyme | 89 |
| Files using React Testing Library | 424 |
| Files using `renderWithProvider` | 423 |
| Migration completion percentage | 82.7% (RTL adoption) |

## Complexity Categories

Tests are categorized into three complexity levels based on the following criteria:

### Simple (Estimated: 0.5-1 hour per file)
Basic component rendering tests with minimal or no mocking. Characteristics include:
- Less than 100 lines of code
- No Engine mocking
- No complex state management
- Simple snapshot tests using `shallow()`
- No async interactions

### Medium (Estimated: 1-2 hours per file)
Tests with moderate complexity. Characteristics include:
- 100-300 lines of code
- Some mocking (hooks, utilities)
- May already use RTL alongside Enzyme
- Some state interactions
- Basic fireEvent usage

### Complex (Estimated: 2-4 hours per file)
Tests with heavy mocking and complex interactions. Characteristics include:
- More than 300 lines of code
- Engine mocking required
- Multiple jest.mock() calls
- Async interactions with waitFor
- Complex state management
- Integration with multiple controllers

## Detailed Inventory

### Component Library - Temporary Components (6 files)

| File Path | Lines | Complexity | Effort (hrs) | Notes |
|-----------|-------|------------|--------------|-------|
| `app/component-library/components-temp/Accounts/AccountBalance/AccountBalance.test.tsx` | 29 | Simple | 0.5 | Basic snapshot test |
| `app/component-library/components-temp/Accounts/AccountBase/AccountBase.test.tsx` | 29 | Simple | 0.5 | Basic snapshot test |
| `app/component-library/components-temp/Contracts/ContractBox/ContractBox.test.tsx` | 32 | Simple | 0.5 | Basic snapshot test |
| `app/component-library/components-temp/Contracts/ContractBoxBase/ContractBoxBase.test.tsx` | 42 | Simple | 0.5 | Basic snapshot test |
| `app/component-library/components-temp/CustomSpendCap/CustomInput/CustomInput.test.tsx` | 74 | Simple | 1 | Basic component test |
| `app/component-library/components-temp/CustomSpendCap/CustomSpendCap.test.tsx` | 168 | Medium | 1.5 | Has RTL and fireEvent |

### Component Library - Core Components (22 files)

| File Path | Lines | Complexity | Effort (hrs) | Notes |
|-----------|-------|------------|--------------|-------|
| `app/component-library/components/Accordions/Accordion/Accordion.test.tsx` | 70 | Simple | 1 | Basic rendering tests |
| `app/component-library/components/Accordions/Accordion/foundation/AccordionHeader/AccordionHeader.test.tsx` | 61 | Simple | 1 | Basic rendering tests |
| `app/component-library/components/Avatars/Avatar/foundation/AvatarBase/AvatarBase.test.tsx` | 19 | Simple | 0.5 | Minimal test |
| `app/component-library/components/Avatars/Avatar/variants/AvatarFavicon/AvatarFavicon.test.tsx` | 93 | Simple | 1 | Has some mocking |
| `app/component-library/components/Avatars/Avatar/variants/AvatarNetwork/AvatarNetwork.test.tsx` | 64 | Simple | 1 | Basic rendering tests |
| `app/component-library/components/Avatars/Avatar/variants/AvatarToken/AvatarToken.test.tsx` | 69 | Simple | 1 | Has one mock |
| `app/component-library/components/Badges/Badge/Badge.test.tsx` | 55 | Simple | 1 | Uses findWhere pattern |
| `app/component-library/components/Badges/Badge/foundation/BadgeBase/BadgeBase.test.tsx` | 36 | Simple | 0.5 | Basic snapshot test |
| `app/component-library/components/Badges/Badge/variants/BadgeStatus/BadgeStatus.test.tsx` | 25 | Simple | 0.5 | Basic snapshot test |
| `app/component-library/components/Badges/BadgeWrapper/BadgeWrapper.test.tsx` | 21 | Simple | 0.5 | Basic snapshot test |
| `app/component-library/components/Buttons/Button/foundation/ButtonBase/ButtonBase.test.tsx` | 37 | Simple | 0.5 | Basic snapshot test |
| `app/component-library/components/Form/HelpText/HelpText.test.tsx` | 49 | Simple | 0.5 | Basic rendering tests |
| `app/component-library/components/Form/Label/Label.test.tsx` | 33 | Simple | 0.5 | Basic rendering tests |
| `app/component-library/components/Form/TextField/TextField.test.tsx` | 49 | Simple | 0.5 | Basic rendering tests |
| `app/component-library/components/Form/TextField/foundation/Input/Input.test.tsx` | 43 | Simple | 0.5 | Basic rendering tests |
| `app/component-library/components/Form/TextFieldSearch/TextFieldSearch.test.tsx` | 21 | Simple | 0.5 | Basic snapshot test |
| `app/component-library/components/List/ListItemColumn/ListItemColumn.test.tsx` | 60 | Simple | 1 | Basic rendering tests |
| `app/component-library/components/Modals/ModalConfirmation/ModalConfirmation.test.tsx` | 62 | Simple | 1 | Basic rendering tests |
| `app/component-library/components/Navigation/TabBarItem/TabBarItem.test.tsx` | 27 | Simple | 0.5 | Basic snapshot test |
| `app/component-library/components/Sheet/SheetHeader/SheetHeader.test.tsx` | 38 | Simple | 0.5 | Basic snapshot test |
| `app/component-library/components/Tags/TagUrl/TagUrl.test.tsx` | 19 | Simple | 0.5 | Minimal test |
| `app/component-library/components/Texts/TextWithPrefixIcon/TextWithPrefixIcon.test.tsx` | 83 | Simple | 1 | Basic rendering tests |

### Approvals Components (9 files)

| File Path | Lines | Complexity | Effort (hrs) | Notes |
|-----------|-------|------------|--------------|-------|
| `app/components/Approvals/AddChainApproval/AddChainApproval.test.tsx` | 55 | Simple | 1 | One mock |
| `app/components/Approvals/ConnectApproval/ConnectApproval.test.tsx` | 54 | Simple | 1 | One mock |
| `app/components/Approvals/FlowLoaderModal/FlowLoaderModal.test.tsx` | 71 | Simple | 1 | Two mocks |
| `app/components/Approvals/SignatureApproval/SignatureApproval.test.tsx` | 59 | Simple | 1 | One mock |
| `app/components/Approvals/SwitchChainApproval/SwitchChainApproval.test.tsx` | 123 | Medium | 1.5 | Engine mock, 4 mocks |
| `app/components/Approvals/TemplateConfirmationModal/TemplateConfirmationModal.test.tsx` | 72 | Simple | 1 | One mock |
| `app/components/Approvals/TransactionApproval/TransactionApproval.test.tsx` | 151 | Medium | 1.5 | Three mocks |
| `app/components/Approvals/WalletConnectApproval/WalletConnectApproval.test.tsx` | 73 | Simple | 1 | One mock |
| `app/components/Approvals/WatchAssetApproval/WatchAssetApproval.test.tsx` | 70 | Simple | 1 | One mock |

### Base Components (2 files)

| File Path | Lines | Complexity | Effort (hrs) | Notes |
|-----------|-------|------------|--------------|-------|
| `app/components/Base/Keypad/Keypad.test.js` | 34 | Simple | 0.5 | Basic snapshot test |
| `app/components/Base/RemoteImage/index.test.tsx` | 96 | Medium | 1.5 | RTL usage, 4 mocks |

### Navigation Components (1 file)

| File Path | Lines | Complexity | Effort (hrs) | Notes |
|-----------|-------|------------|--------------|-------|
| `app/components/Nav/Main/index.test.tsx` | 193 | Medium | 2 | Engine mock |

### UI Components (26 files)

| File Path | Lines | Complexity | Effort (hrs) | Notes |
|-----------|-------|------------|--------------|-------|
| `app/components/UI/AccountFromToInfoCard/AccountFromToInfoCard.test.tsx` | 242 | Medium | 2 | Engine mock, 6 mocks, mixed RTL/Enzyme |
| `app/components/UI/AddCustomCollectible/index.test.tsx` | 26 | Simple | 0.5 | One mock |
| `app/components/UI/AssetElement/index.test.tsx` | 106 | Medium | 1.5 | RTL, fireEvent |
| `app/components/UI/AssetOverview/AssetActionButton/index.test.tsx` | 35 | Simple | 0.5 | Basic snapshot test |
| `app/components/UI/CollectibleContractInformation/index.test.tsx` | 112 | Medium | 1.5 | RTL, fireEvent, one mock |
| `app/components/UI/CollectibleContractOverview/index.test.tsx` | 153 | Medium | 1.5 | RTL, fireEvent, one mock |
| `app/components/UI/CollectibleContracts/index.test.tsx` | 911 | Complex | 4 | Engine mock, RTL, 3 mocks |
| `app/components/UI/CollectibleOverview/index.test.tsx` | 36 | Simple | 0.5 | Basic snapshot test |
| `app/components/UI/EditGasFee1559/index.test.tsx` | 21 | Simple | 0.5 | Basic snapshot test |
| `app/components/UI/EditGasFeeLegacy/index.test.tsx` | 21 | Simple | 0.5 | Basic snapshot test |
| `app/components/UI/GenericButton/index.test.tsx` | 19 | Simple | 0.5 | Minimal test |
| `app/components/UI/HintModal/index.test.tsx` | 22 | Simple | 0.5 | Basic snapshot test |
| `app/components/UI/LedgerModals/Steps/ConfirmationStep.test.tsx` | 30 | Simple | 0.5 | Basic snapshot test |
| `app/components/UI/LedgerModals/Steps/ErrorStep.test.tsx` | 95 | Simple | 1 | Basic rendering tests |
| `app/components/UI/LoginOptionsSwitch/LoginOptionsSwitch.test.tsx` | 40 | Simple | 0.5 | Basic snapshot test |
| `app/components/UI/NavbarTitle/index.test.js` | 20 | Simple | 0.5 | Basic snapshot test |
| `app/components/UI/PaymentRequest/AssetList/index.test.tsx` | 29 | Simple | 0.5 | Basic snapshot test |
| `app/components/UI/SettingsNotification/index.test.tsx` | 23 | Simple | 0.5 | Basic snapshot test |
| `app/components/UI/SkipAccountSecurityModal/index.test.tsx` | 21 | Simple | 0.5 | Basic snapshot test |
| `app/components/UI/StyledButton/index.test.tsx` | 22 | Simple | 0.5 | Basic snapshot test |
| `app/components/UI/Swaps/components/TokenIcon.test.js` | 35 | Simple | 0.5 | Basic snapshot test |
| `app/components/UI/Swaps/components/TokenSelectButton.test.js` | 36 | Simple | 0.5 | Basic snapshot test |
| `app/components/UI/Tabs/TabCountIcon/index.test.tsx` | 25 | Simple | 0.5 | Basic snapshot test |
| `app/components/UI/TokenImage/index.test.tsx` | 35 | Simple | 0.5 | Basic snapshot test |
| `app/components/UI/Transactions/index.test.tsx` | 53 | Simple | 1 | Basic rendering tests |

### Views Components (23 files)

| File Path | Lines | Complexity | Effort (hrs) | Notes |
|-----------|-------|------------|--------------|-------|
| `app/components/Views/ChoosePassword/index.test.tsx` | 34 | Simple | 0.5 | Basic snapshot test |
| `app/components/Views/Collectible/index.test.tsx` | 122 | Medium | 2 | Engine mock, RTL, 3 mocks |
| `app/components/Views/ManualBackupStep1/index.test.tsx` | 42 | Simple | 0.5 | Basic snapshot test |
| `app/components/Views/ManualBackupStep2/index.test.tsx` | 45 | Simple | 0.5 | Basic snapshot test |
| `app/components/Views/ManualBackupStep3/index.test.tsx` | 20 | Simple | 0.5 | Basic snapshot test |
| `app/components/Views/ResetPassword/index.test.tsx` | 29 | Simple | 0.5 | Basic snapshot test |
| `app/components/Views/Settings/Contacts/ContactForm/index.test.tsx` | 25 | Simple | 0.5 | Basic snapshot test |
| `app/components/Views/Settings/Contacts/index.test.tsx` | 25 | Simple | 0.5 | Basic snapshot test |
| `app/components/Views/Settings/GeneralSettings/index.test.tsx` | 130 | Medium | 1.5 | One mock |
| `app/components/Views/Settings/NetworksSettings/NetworkSettings/index.test.tsx` | 1908 | Complex | 4 | Engine mock, 2 mocks, very large |
| `app/components/Views/SimpleWebview/index.test.tsx` | 20 | Simple | 0.5 | Basic snapshot test |
| `app/components/Views/confirmations/legacy/Approval/components/TransactionEditor/index.test.tsx` | 36 | Simple | 0.5 | Basic snapshot test |
| `app/components/Views/confirmations/legacy/SendFlow/components/CustomNonceModal/index.test.tsx` | 69 | Simple | 1 | Basic rendering tests |
| `app/components/Views/confirmations/legacy/components/PersonalSign/index.test.tsx` | 304 | Complex | 3 | Engine mock, 7 mocks |
| `app/components/Views/confirmations/legacy/components/SignatureRequest/ExpandedMessage/index.test.tsx` | 19 | Simple | 0.5 | Minimal test |
| `app/components/Views/confirmations/legacy/components/SignatureRequest/Root/Root.test.tsx` | 129 | Medium | 2 | Engine mock, RTL, 3 mocks |
| `app/components/Views/confirmations/legacy/components/SignatureRequest/index.test.tsx` | 27 | Simple | 0.5 | Basic snapshot test |
| `app/components/Views/confirmations/legacy/components/TransactionReview/TransactionReviewData/index.test.tsx` | 38 | Simple | 0.5 | Basic snapshot test |
| `app/components/Views/confirmations/legacy/components/TransactionReview/TransactionReviewDetailsCard/index.test.js` | 25 | Simple | 0.5 | Basic snapshot test |
| `app/components/Views/confirmations/legacy/components/TransactionReview/TransactionReviewInformation/index.test.tsx` | 48 | Simple | 0.5 | Basic snapshot test |
| `app/components/Views/confirmations/legacy/components/TransactionReview/TransactionReviewSummary/index.test.tsx` | 38 | Simple | 0.5 | Basic snapshot test |
| `app/components/Views/confirmations/legacy/components/TransactionReview/index.test.jsx` | 351 | Complex | 3.5 | Engine mock, RTL, fireEvent, 13 mocks |
| `app/components/Views/confirmations/legacy/components/TypedSign/index.test.tsx` | 436 | Complex | 4 | Engine mock, RTL, fireEvent, waitFor, 4 mocks |
| `app/components/Views/confirmations/legacy/components/WatchAssetRequest/index.test.tsx` | 29 | Simple | 0.5 | Basic snapshot test |

## Summary by Complexity

| Complexity | File Count | Total Estimated Hours |
|------------|------------|----------------------|
| Simple | 66 | 39.5 |
| Medium | 15 | 25.5 |
| Complex | 8 | 29.5 |
| **Total** | **89** | **94.5** |

## Migration Priority Recommendations

### Phase 3 Priority Order (Recommended)

1. **High Priority - Component Library (28 files, ~18 hours)**
   - These are foundational components used throughout the app
   - Mostly simple tests, quick wins
   - Low risk of breaking changes

2. **Medium Priority - UI Components (26 files, ~18 hours)**
   - Core UI building blocks
   - Mix of simple and medium complexity
   - Some already have partial RTL adoption

3. **Medium Priority - Approvals (9 files, ~10 hours)**
   - Important for transaction flows
   - Mostly simple tests

4. **Lower Priority - Views (23 files, ~25 hours)**
   - More complex tests
   - Higher risk, requires more careful migration
   - Contains the most complex files (NetworkSettings, TransactionReview, TypedSign)

5. **Lowest Priority - Base/Nav (3 files, ~4 hours)**
   - Small number of files
   - Can be done alongside other work

## Common Migration Patterns

### Pattern 1: Simple Snapshot Test
```typescript
// Before (Enzyme)
import { shallow } from 'enzyme';
const wrapper = shallow(<Component {...props} />);
expect(wrapper).toMatchSnapshot();

// After (RTL)
import { render } from '@testing-library/react-native';
const { toJSON } = render(<Component {...props} />);
expect(toJSON()).toMatchSnapshot();
```

### Pattern 2: Finding Elements
```typescript
// Before (Enzyme)
const element = wrapper.find('Text');
const elementByTestId = wrapper.findWhere(
  (node) => node.prop('testID') === 'my-test-id'
);

// After (RTL)
const element = screen.getByText('expected text');
const elementByTestId = screen.getByTestId('my-test-id');
```

### Pattern 3: Testing Props
```typescript
// Before (Enzyme)
expect(wrapper.find('Text').props().children).toBe('text');

// After (RTL)
expect(screen.getByText('text')).toBeTruthy();
```

### Pattern 4: With Redux Provider
```typescript
// Before (Enzyme)
import { shallow } from 'enzyme';
import { Provider } from 'react-redux';
const wrapper = shallow(
  <Provider store={store}>
    <Component />
  </Provider>
);

// After (RTL)
import renderWithProvider from '../../../util/test/renderWithProvider';
const { getByText } = renderWithProvider(<Component />, { state: mockState });
```

## Test Utilities Available

The codebase provides several test utilities in `app/util/test/`:

1. **`renderWithProvider`** - Renders components with Redux store and theme context
2. **`renderScreen`** - Renders components within a navigation stack
3. **`renderHookWithProvider`** - Renders hooks with Redux provider
4. **`configureStore`** - Creates a mock Redux store for testing

## Next Steps

1. Update ESLint configuration to prevent new Enzyme imports
2. Create migration helper scripts
3. Begin Phase 3 migration starting with Component Library files
4. Update snapshots as tests are migrated
5. Remove Enzyme dependencies from package.json after all migrations complete

## Appendix: Files Already Using Both Enzyme and RTL

These files are partially migrated and should be prioritized for completion:

1. `app/component-library/components-temp/CustomSpendCap/CustomSpendCap.test.tsx`
2. `app/components/UI/AccountFromToInfoCard/AccountFromToInfoCard.test.tsx`
3. `app/components/UI/AssetElement/index.test.tsx`
4. `app/components/UI/CollectibleContractInformation/index.test.tsx`
5. `app/components/UI/CollectibleContractOverview/index.test.tsx`
6. `app/components/UI/CollectibleContracts/index.test.tsx`
7. `app/components/Views/Collectible/index.test.tsx`
8. `app/components/Views/confirmations/legacy/components/SignatureRequest/Root/Root.test.tsx`
9. `app/components/Views/confirmations/legacy/components/TransactionReview/index.test.jsx`
10. `app/components/Views/confirmations/legacy/components/TypedSign/index.test.tsx`
