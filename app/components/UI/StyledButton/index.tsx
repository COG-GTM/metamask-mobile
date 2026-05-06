// Note: Metro's platform-specific resolver picks `index.ios.tsx` or
// `index.android.tsx` at runtime. This file exists so non-platform-aware
// tooling (TypeScript, IDE go-to-definition) can resolve a default import
// from `./StyledButton`. The two platform implementations share the same
// public Props shape; re-export the iOS variant here as the canonical type.
import StyledButton from './index.ios';
/**
 * @deprecated The `<StyledButton>` component has been deprecated in favor of the new `<Button>` component from the component-library.
 * Please update your code to use the new `<Button>` component instead, which can be found at app/component-library/components/Buttons/Button/Button.tsx.
 * You can find documentation for the new Button component in the README:
 * {@link https://github.com/MetaMask/metamask-mobile/tree/main/app/component-library/components/Buttons/Button/README.md}
 * If you would like to help with the replacement of the old `Button` component, please submit a pull request against this GitHub issue:
 * {@link https://github.com/MetaMask/metamask-mobile/issues/8106}
 */
export default StyledButton;
