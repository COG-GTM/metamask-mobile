// The concrete implementation is resolved per-platform by the bundler
// (index.ios / index.android). This generic entry is a fallback shim and the
// module below is intentionally unresolved at type-check time.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error Platform-specific StyledButton is resolved at runtime by the bundler.
import StyledButton from './StyledButton'; // eslint-disable-line import/no-unresolved
/**
 * @deprecated The `<StyledButton>` component has been deprecated in favor of the new `<Button>` component from the component-library.
 * Please update your code to use the new `<Button>` component instead, which can be found at app/component-library/components/Buttons/Button/Button.tsx.
 * You can find documentation for the new Button component in the README:
 * {@link https://github.com/MetaMask/metamask-mobile/tree/main/app/component-library/components/Buttons/Button/README.md}
 * If you would like to help with the replacement of the old `Button` component, please submit a pull request against this GitHub issue:
 * {@link https://github.com/MetaMask/metamask-mobile/issues/8106}
 */
export default StyledButton;
