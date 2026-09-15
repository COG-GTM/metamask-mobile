// This file contains type declarations for asset types.
// Ex. This makes it so that when you import CloseIcon from './close-icon.svg, CloseIcon, will be detected as a React.FC component.
declare module '*.mp4';

declare module '@metamask/react-native-payments/lib/js/__mocks__';

declare module 'react-native-fade-in-image';

declare module 'react-native-fast-crypto';

declare module 'react-native-minimizer';

declare module 'react-native-tcp-socket';

declare module 'xhr2';
declare module 'react-native-scrollable-tab-view/DefaultTabBar' {
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const content: React.FC<any>;
  export default content;
}

declare module '*.svg' {
  import { SvgProps } from 'react-native-svg';
  const content: React.FC<SvgProps & { name: string }>;
  export default content;
}

declare module 'images/image-icons' {
  const content: { [key: string]: ImageSourcePropType };
  export default content;
}

declare module 'eth-ens-namehash' {
  const namehash: {
    hash(name: string): string;
  };
  export default namehash;
}

declare module '@metamask/ethjs-query' {
  import type { Provider } from '@metamask/network-controller';

  class Eth {
    constructor(provider: Provider);
  }

  export default Eth;
}

declare module '@metamask/ethjs-contract' {
  type ContractMethod = (...args: unknown[]) => Promise<[string]>;

  interface ContractInstance {
    [method: string]: ContractMethod;
  }

  interface ContractFactory {
    at(address: string): ContractInstance;
  }

  type EthContract = new (eth: unknown) => (abi: unknown[]) => ContractFactory;

  const EthContract: EthContract;
  export default EthContract;
}

declare module 'content-hash' {
  const contentHash: {
    decode(value: string): string;
    getCodec(value: string): string;
  };
  export default contentHash;
}

declare module 'multihashes' {
  const multihash: {
    fromHexString(value: string): Uint8Array;
    toB58String(value: Uint8Array): string;
    encode(value: Uint8Array, codec: string): Uint8Array;
  };
  export default multihash;
}

declare module '*.png' {
  import { ImageSourcePropType } from 'react-native';
  const content: ImageSourcePropType;
  export default content;
}

declare module '@react-native-community/checkbox' {
  import { CheckBoxProps } from '@react-native-community/checkbox';

  const CheckBox: ComponentType<CheckBoxProps>;

  /**
   * @deprecated The `<CheckBox />` component has been deprecated in favor of the new `<Checkbox>` component from the component-library.
   * Please update your code to use the new `<Checkbox>` component instead, which can be found at app/component-library/components/Checkbox/Checkbox.tsx.
   * You can find documentation for the new Checkbox component in the README:
   * {@link https://github.com/MetaMask/metamask-mobile/tree/main/app/component-library/components/Checkbox}
   * If you would like to help with the replacement of the old CheckBox component, please submit a pull request against this GitHub issue:
   * {@link https://github.com/MetaMask/metamask-mobile/issues/6882}
   */
  export default CheckBox;
}

declare module 'react-native-vector-icons/Ionicons' {
  import { IconProps } from 'react-native-vector-icons/Ionicons';

  const IonicIcon: ComponentType<IconProps>;

  /**
   * @deprecated The `<IonicIcon />` component has been deprecated in favor of the new `<Icon>` component from the component-library.
   * Please update your code to use the new `<Icon>` component instead, which can be found at app/component-library/components/Icons/Icon/Icon.tsx.
   * You can find documentation for the new Icon component in the README:
   * {@link https://github.com/MetaMask/metamask-mobile/tree/main/app/component-library/components/Icons/Icon/README.md}
   * If you would like to help with the replacement of the usage of the IonicIcon component, please submit a pull request against this GitHub issue:
   * {@link https://github.com/MetaMask/metamask-mobile/issues/8110}
   */
  export default IonicIcon;
}

declare module 'react-native-vector-icons/FontAwesome' {
  import { IconProps } from 'react-native-vector-icons/FontAwesome';

  const FontAwesomeIcon: ComponentType<IconProps>;

  /**
   * @deprecated The `<FontAwesomeIcon />` component has been deprecated in favor of the new `<Icon>` component from the component-library.
   * Please update your code to use the new `<Icon>` component instead, which can be found at app/component-library/components/Icons/Icon/Icon.tsx.
   * You can find documentation for the new Icon component in the README:
   * {@link https://github.com/MetaMask/metamask-mobile/tree/main/app/component-library/components/Icons/Icon/README.md}
   * If you would like to help with the replacement of the usage of the FontAwesomeIcon component, please submit a pull request against this GitHub issue:
   * {@link https://github.com/MetaMask/metamask-mobile/issues/8111}
   */
  export default FontAwesomeIcon;
}

declare module 'react-native-vector-icons/AntDesign' {
  import { IconProps } from 'react-native-vector-icons/AntDesign';

  const AntDesignIcon: ComponentType<IconProps>;

  /**
   * @deprecated The `<AntDesignIcon />` component has been deprecated in favor of the new `<Icon>` component from the component-library.
   * Please update your code to use the new `<Icon>` component instead, which can be found at app/component-library/components/Icons/Icon/Icon.tsx.
   * You can find documentation for the new Icon component in the README:
   * {@link https://github.com/MetaMask/metamask-mobile/tree/main/app/component-library/components/Icons/Icon/README.md}
   * If you would like to help with the replacement of the usage of the AntDesignIcon component, please submit a pull request against this GitHub issue:
   * {@link https://github.com/MetaMask/metamask-mobile/issues/8112}
   */
  export default AntDesignIcon;
}

declare module 'react-native-vector-icons/MaterialCommunityIcons' {
  import { IconProps } from 'react-native-vector-icons/MaterialCommunityIcons';

  const MaterialCommunityIcons: ComponentType<IconProps>;
  /**
   * @deprecated The `<MaterialCommunityIconsIcon />` component has been deprecated in favor of the new `<Icon>` component from the component-library.
   * Please update your code to use the new `<Icon>` component instead, which can be found at app/component-library/components/Icons/Icon/Icon.tsx.
   * You can find documentation for the new Icon component in the README:
   * {@link https://github.com/MetaMask/metamask-mobile/tree/main/app/component-library/components/Icons/Icon/README.md}
   * If you would like to help with the replacement of the usage of the MaterialCommunityIcons component, please submit a pull request against this GitHub issue:
   * {@link https://github.com/MetaMask/metamask-mobile/issues/8113}
   */
  export default MaterialCommunityIcons;
}

declare module 'react-native-vector-icons/Feather' {
  import { IconProps } from 'react-native-vector-icons/Feather';

  const FeatherIcon: ComponentType<IconProps>;

  /**
   * @deprecated The `<FeatherIcon />` component has been deprecated in favor of the new `<Icon>` component from the component-library.
   * Please update your code to use the new `<Icon>` component instead, which can be found at app/component-library/components/Icons/Icon/Icon.tsx.
   * You can find documentation for the new Icon component in the README:
   * {@link https://github.com/MetaMask/metamask-mobile/tree/main/app/component-library/components/Icons/Icon/README.md}
   * If you would like to help with the replacement of the usage of the FeatherIcon component, please submit a pull request against this GitHub issue:
   * {@link https://github.com/MetaMask/metamask-mobile/issues/8114}
   */
  export default FeatherIcon;
}

declare module 'react-native-vector-icons/EvilIcons' {
  import { IconProps } from 'react-native-vector-icons/EvilIcons';

  const EvilIcons: ComponentType<IconProps>;

  /**
   * @deprecated The `<EvilIconsIcon />` component has been deprecated in favor of the new `<Icon>` component from the component-library.
   * Please update your code to use the new `<Icon>` component instead, which can be found at app/component-library/components/Icons/Icon/Icon.tsx.
   * You can find documentation for the new Icon component in the README:
   * {@link https://github.com/MetaMask/metamask-mobile/tree/main/app/component-library/components/Icons/Icon/README.md}
   * If you would like to help with the replacement of the usage of the EvilIcons component, please submit a pull request against this GitHub issue:
   * {@link https://github.com/MetaMask/metamask-mobile/issues/8115}
   */
  export default EvilIcons;
}

declare module 'react-native-vector-icons/SimpleLineIcons' {
  import { IconProps } from 'react-native-vector-icons/SimpleLineIcons';

  const SimpleLineIcons: ComponentType<IconProps>;

  /**
   * @deprecated The `<SimpleLineIconsIcon />` component has been deprecated in favor of the new `<Icon>` component from the component-library.
   * Please update your code to use the new `<Icon>` component instead, which can be found at app/component-library/components/Icons/Icon/Icon.tsx.
   * You can find documentation for the new Icon component in the README:
   * {@link https://github.com/MetaMask/metamask-mobile/tree/main/app/component-library/components/Icons/Icon/README.md}
   * If you would like to help with the replacement of the usage of the SimpleLineIcons component, please submit a pull request against this GitHub issue:
   * {@link https://github.com/MetaMask/metamask-mobile/issues/8116}
   */
  export default SimpleLineIcons;
}

declare module 'react-native-vector-icons/MaterialIcons' {
  import { IconProps } from 'react-native-vector-icons/MaterialIcons';

  const MaterialIcons: ComponentType<IconProps>;

  /**
   * @deprecated The `<MaterialIconsIcon />` component has been deprecated in favor of the new `<Icon>` component from the component-library.
   * Please update your code to use the new `<Icon>` component instead, which can be found at app/component-library/components/Icons/Icon/Icon.tsx.
   * You can find documentation for the new Icon component in the README:
   * {@link https://github.com/MetaMask/metamask-mobile/tree/main/app/component-library/components/Icons/Icon/README.md}
   * If you would like to help with the replacement of the usage of the MaterialIcons component, please submit a pull request against this GitHub issue:
   * {@link https://github.com/MetaMask/metamask-mobile/issues/8117}
   */
  export default MaterialIcons;
}

declare module 'react-native-vector-icons/FontAwesome5' {
  import { IconProps } from 'react-native-vector-icons/FontAwesome5';

  const FontAwesome5: ComponentType<IconProps>;

  /**
   * @deprecated The `<FontAwesome5Icon />` component has been deprecated in favor of the new `<Icon>` component from the component-library.
   * Please update your code to use the new `<Icon>` component instead, which can be found at app/component-library/components/Icons/Icon/Icon.tsx.
   * You can find documentation for the new Icon component in the README:
   * {@link https://github.com/MetaMask/metamask-mobile/tree/main/app/component-library/components/Icons/Icon/README.md}
   * If you would like to help with the replacement of the usage of the FontAwesome5 component, please submit a pull request against this GitHub issue:
   * {@link https://github.com/MetaMask/metamask-mobile/issues/8118}
   */
  export default FontAwesome5;
}

declare module 'react-native-vector-icons/Octicons' {
  import { IconProps } from 'react-native-vector-icons/Octicons';

  const Octicons: ComponentType<IconProps>;

  /**
   * @deprecated The `<OcticonsIcon />` component has been deprecated in favor of the new `<Icon>` component from the component-library.
   * Please update your code to use the new `<Icon>` component instead, which can be found at app/component-library/components/Icons/Icon/Icon.tsx.
   * You can find documentation for the new Icon component in the README:
   * {@link https://github.com/MetaMask/metamask-mobile/tree/main/app/component-library/components/Icons/Icon/README.md}
   * If you would like to help with the replacement of the usage of the Octicons component, please submit a pull request against this GitHub issue:
   * {@link https://github.com/MetaMask/metamask-mobile/issues/8119}
   */
  export default Octicons;
}

declare module 'react-native-vector-icons/Entypo' {
  import { IconProps } from 'react-native-vector-icons/Entypo';

  const Entypo: ComponentType<IconProps>;

  /**
   * @deprecated The `<EntypoIcon />` component has been deprecated in favor of the new `<Icon>` component from the component-library.
   * Please update your code to use the new `<Icon>` component instead, which can be found at app/component-library/components/Icons/Icon/Icon.tsx.
   * You can find documentation for the new Icon component in the README:
   * {@link https://github.com/MetaMask/metamask-mobile/tree/main/app/component-library/components/Icons/Icon/README.md}
   * If you would like to help with the replacement of the usage of the Entypo component, please submit a pull request against this GitHub issue:
   * {@link https://github.com/MetaMask/metamask-mobile/issues/8120}
   */
  export default Entypo;
}

declare module 'react-native-vector-icons/Foundation' {
  import { IconProps } from 'react-native-vector-icons/Foundation';

  const Foundation: ComponentType<IconProps>;

  /**
   * @deprecated The `<FoundationIcon />` component has been deprecated in favor of the new `<Icon>` component from the component-library.
   * Please update your code to use the new `<Icon>` component instead, which can be found at app/component-library/components/Icons/Icon/Icon.tsx.
   * You can find documentation for the new Icon component in the README:
   * {@link https://github.com/MetaMask/metamask-mobile/tree/main/app/component-library/components/Icons/Icon/README.md}
   * If you would like to help with the replacement of the usage of the Foundation component, please submit a pull request against this GitHub issue:
   * {@link https://github.com/MetaMask/metamask-mobile/issues/8121}
   */
  export default Foundation;
}

declare module 'react-native-vector-icons/Fontisto' {
  import { IconProps } from 'react-native-vector-icons/Fontisto';

  const Fontisto: ComponentType<IconProps>;

  /**
   * @deprecated The `<FontistoIcon />` component has been deprecated in favor of the new `<Icon>` component from the component-library.
   * Please update your code to use the new `<Icon>` component instead, which can be found at app/component-library/components/Icons/Icon/Icon.tsx.
   * You can find documentation for the new Icon component in the README:
   * {@link https://github.com/MetaMask/metamask-mobile/tree/main/app/component-library/components/Icons/Icon/README.md}
   * If you would like to help with the replacement of the usage of the Fontisto component, please submit a pull request against this GitHub issue:
   * {@link https://github.com/MetaMask/metamask-mobile/issues/8122}
   */
  export default Fontisto;
}

declare module 'react-native-vector-icons/Zocial' {
  import { IconProps } from 'react-native-vector-icons/Zocial';

  const Zocial: ComponentType<IconProps>;

  /**
   * @deprecated The `<ZocialIcon />` component has been deprecated in favor of the new `<Icon>` component from the component-library.
   * Please update your code to use the new `<Icon>` component instead, which can be found at app/component-library/components/Icons/Icon/Icon.tsx.
   * You can find documentation for the new Icon component in the README:
   * {@link https://github.com/MetaMask/metamask-mobile/tree/main/app/component-library/components/Icons/Icon/README.md}
   * If you would like to help with the replacement of the usage of the Zocial component, please submit a pull request against this GitHub issue:
   * {@link https://github.com/MetaMask/metamask-mobile/issues/8123}
   */
  export default Zocial;
}

declare module '@metamask/contract-metadata' {
  const content: Record<string, TokenListToken>;
  export default content;
}

declare module './util/termsOfUse/termsOfUseContent.ts' {
  const content: string;
  export default content;
}

declare module 'react-native-emoji' {
  const emoji: React.JSX;
  export default emoji;
}

declare module '@metamask/react-native-actionsheet' {
  const ActionSheet;
  export default ActionSheet;
}

declare module '@metamask/react-native-search-api';

/**
 * @sentry/react-native types for v^6.10.0
 * Types are overridden to ensure captureException receives an Error type for more reliable stack traces
 * Reference - https://docs.sentry.io/platforms/javascript/usage/#capturing-errors
 */
declare module '@sentry/react-native' {
  export type {
    Breadcrumb,
    Request,
    SdkInfo,
    Event,
    Exception,
    SendFeedbackParams,
    SeverityLevel,
    Span,
    StackFrame,
    Stacktrace,
    Thread,
    User,
    UserFeedback,
  } from '@sentry/core';

  export {
    addBreadcrumb,
    captureEvent,
    captureFeedback,
    captureMessage,
    Scope,
    setContext,
    setExtra,
    setExtras,
    setTag,
    setTags,
    setUser,
    startInactiveSpan,
    startSpan,
    startSpanManual,
    getActiveSpan,
    getRootSpan,
    withActiveSpan,
    suppressTracing,
    spanToJSON,
    spanIsSampled,
    setMeasurement,
    getCurrentScope,
    getGlobalScope,
    getIsolationScope,
    getClient,
    setCurrentClient,
    addEventProcessor,
    metricsDefault as metrics,
    lastEventId,
  } from '@sentry/core';

  export {
    ErrorBoundary,
    withErrorBoundary,
    createReduxEnhancer,
    Profiler,
    useProfiler,
    withProfiler,
  } from '@sentry/react';

  export * from '@sentry/react-native/dist/js/integrations/exports';
  export { SDK_NAME, SDK_VERSION } from '@sentry/react-native/dist/js/version';
  export type { ReactNativeOptions } from '@sentry/react-native/dist/js/options';
  export { ReactNativeClient } from '@sentry/react-native/dist/js/client';
  export {
    init,
    wrap,
    nativeCrash,
    flush,
    close,
    captureUserFeedback,
    withScope,
    crashedLastRun,
  } from '@sentry/react-native/dist/js/sdk';
  export {
    TouchEventBoundary,
    withTouchEventBoundary,
  } from '@sentry/react-native/dist/js/touchevents';
  export {
    reactNativeTracingIntegration,
    getCurrentReactNativeTracingIntegration,
    getReactNativeTracingIntegration,
    reactNavigationIntegration,
    reactNativeNavigationIntegration,
    sentryTraceGesture,
    TimeToInitialDisplay,
    TimeToFullDisplay,
    startTimeToInitialDisplaySpan,
    startTimeToFullDisplaySpan,
    startIdleNavigationSpan,
    startIdleSpan,
    getDefaultIdleNavigationSpanOptions,
    createTimeToFullDisplay,
    createTimeToInitialDisplay,
  } from '@sentry/react-native/dist/js/tracing';
  export type { TimeToDisplayProps } from '@sentry/react-native/dist/js/tracing';
  export { Mask, Unmask } from '@sentry/react-native/dist/js/replay/CustomMask';
  export { FeedbackWidget } from '@sentry/react-native/dist/js/feedback/FeedbackWidget';
  export { showFeedbackWidget } from '@sentry/react-native/dist/js/feedback/FeedbackWidgetManager';
  export { getDataFromUri } from '@sentry/react-native/dist/js/wrapper';

  // Enforce exception to be of type Error for more reliable stack traces - https://docs.sentry.io/platforms/javascript/usage/#capturing-errors
  import { ExclusiveEventHintOrCaptureContext } from '@sentry/core/build/types/utils/prepareEvent';
  const captureException: (
    exception: Error,
    hint?: ExclusiveEventHintOrCaptureContext,
  ) => string;
  export { captureException };
}

declare module '@metamask/react-native-button' {
  import { ComponentType, ReactNode } from 'react';
  // eslint-disable-next-line no-duplicate-imports
  import { StyleProp, TextStyle, ViewStyle } from 'react-native';

  interface ButtonProps {
    style?: StyleProp<TextStyle>;
    containerStyle?: StyleProp<ViewStyle>;
    onPress?: () => void;
    disabled?: boolean;
    testID?: string;
    children?: ReactNode;
  }

  const Button: ComponentType<ButtonProps>;
  export default Button;
}

declare module 'zxcvbn' {
  interface ZXCVBNResult {
    score: 0 | 1 | 2 | 3 | 4;
  }
  function zxcvbn(password: string, userInputs?: string[]): ZXCVBNResult;
  export default zxcvbn;
}

declare module 'readable-stream' {
  // eslint-disable-next-line import/no-nodejs-modules
  import stream from 'stream';
  export = stream;
}

declare module 'zxcvbn' {
  interface ZXCVBNResult {
    score: 0 | 1 | 2 | 3 | 4;
    guesses: number;
    feedback: { warning: string; suggestions: string[] };
  }
  function zxcvbn(password: string, userInputs?: string[]): ZXCVBNResult;
  export default zxcvbn;
}

declare module 'react-native-confetti' {
  import { Component } from 'react';

  export interface ConfettiViewProps {
    confettiCount?: number;
    timeout?: number;
    untilStopped?: boolean;
    startOnLoad?: boolean;
    colors?: string[];
    size?: number;
    bsize?: number;
    duration?: number;
  }

  export default class ConfettiView extends Component<ConfettiViewProps> {
    startConfetti(onComplete?: () => void): void;
    stopConfetti(): void;
  }

  export type ConfettiViewRef = ConfettiView;
}

declare module 'react-native/Libraries/Image/resolveAssetSource' {
  export default function resolveAssetSource(
    source?: import('react-native').ImageSourcePropType,
  ): import('react-native').ImageResolvedAssetSource & {
    __packager_asset?: boolean;
  };
}

declare module 'human-standard-token-abi' {
  import { JsonFragment } from '@ethersproject/abi';
  const abi: readonly JsonFragment[];
  export default abi;
}

declare module '@metamask/ethjs-query' {
  /**
   * Minimal typing for the ethjs-query JSON-RPC wrapper; the instance exposes
   * one method per `eth_*` RPC method (e.g. `getBalance`, `call`).
   */
  class Eth {
    constructor(provider: unknown, options?: { debug?: boolean });
    [rpcMethod: string]: (...args: unknown[]) => Promise<unknown>;
  }
  export default Eth;
}

declare module 'through2' {
  type TransformCallback = (error?: Error | null, data?: unknown) => void;

  // Minimal shape of the `readable-stream` Transform returned by through2;
  // `readable-stream` ships no typings in this repo.
  interface Through2Transform {
    push(chunk: unknown, encoding?: string): boolean;
    pipe<T>(destination: T, options?: { end?: boolean }): T;
    on(event: string, listener: (...args: unknown[]) => void): this;
    once(event: string, listener: (...args: unknown[]) => void): this;
    write(chunk: unknown, callback?: (error?: Error | null) => void): boolean;
    end(callback?: () => void): void;
    destroy(error?: Error): void;
  }

  type TransformFunction = (
    this: Through2Transform,
    chunk: unknown,
    encoding: string,
    callback: TransformCallback,
  ) => void;

  function through2(
    options?: Record<string, unknown>,
    transform?: TransformFunction,
  ): Through2Transform;
  namespace through2 {
    function obj(transform?: TransformFunction): Through2Transform;
  }
  export = through2;
}

declare module 'pump' {
  type PumpCallback = (err?: Error | null) => void;
  // Streams from `readable-stream` are untyped in this repo, so accept any stream-like object.
  type PumpStream = object;
  function pump(...streams: (PumpStream | PumpCallback)[]): PumpStream;
  export = pump;
}

// The package ships its typings as `index.ts.d` (misnamed), so TS cannot resolve them.
declare module 'unicode-confusables' {
  export interface ConfusablePoint {
    point: string;
    similarTo?: string;
  }
  export const isConfusing: (input: string) => boolean;
  export const confusables: (input: string) => ConfusablePoint[];
  export const rectifyConfusion: (input: string) => string;
}

declare module 'ethjs-ens' {
  interface EnsOptions {
    provider: unknown;
    network: string | number;
    registryAddress?: string;
  }

  class Ens {
    constructor(opts?: EnsOptions);
    lookup(name?: string): Promise<string>;
    reverse(address: string): Promise<string>;
    getOwner(name?: string): Promise<string>;
    getResolver(name?: string): Promise<unknown>;
    getResolverAddress(name?: string): Promise<string>;
  }

  export = Ens;
}

declare module '@metamask/ethjs-unit' {
  import BN from 'bnjs4';

  type EthjsUnitValue = string | number | BN;

  interface FromWeiOptions {
    pad?: boolean;
    commify?: boolean;
  }

  const ethjsUnit: {
    unitMap: Record<string, string>;
    numberToString(arg: EthjsUnitValue): string;
    getValueOfUnit(unitInput?: string): BN;
    fromWei(
      weiInput: EthjsUnitValue,
      unit?: string,
      optionsInput?: FromWeiOptions,
    ): string;
    toWei(etherInput: EthjsUnitValue, unit?: string): BN;
  };
  export = ethjsUnit;
}

declare module 'number-to-bn' {
  type BN = import('bnjs4');

  function numberToBN(arg: string | number | BN | { toString(): string }): BN;
  export = numberToBN;
}

// `lib` is es2017 but Hermes/RN ship `String.prototype.replaceAll` at runtime.
interface String {
  replaceAll(searchValue: string | RegExp, replaceValue: string): string;
}

declare module 'ethereumjs-abi' {
  function rawEncode(types: string[], values: unknown[]): Buffer;
  function rawDecode(types: string[], data: Buffer): unknown[];
}

declare module 'humanize-duration' {
  interface HumanizeDurationOptions {
    language?: string;
    fallbacks?: string[];
    delimiter?: string;
    spacer?: string;
    largest?: number;
    units?: string[];
    round?: boolean;
    decimal?: string;
    conjunction?: string;
    serialComma?: boolean;
    maxDecimalPoints?: number;
  }
  function humanizeDuration(
    ms: number | null | undefined,
    options?: HumanizeDurationOptions,
  ): string;
  export = humanizeDuration;
}

declare module '@react-native-clipboard/clipboard/jest/clipboard-mock.js' {
  const mockClipboard: Record<string, jest.Mock>;
  export default mockClipboard;
}

declare module 'enzyme-adapter-react-16' {
  import type { EnzymeAdapter } from 'enzyme';

  class Adapter extends EnzymeAdapter {}
  export default Adapter;
}

declare module '@metamask/ethjs-query' {
  export default class Eth {
    constructor(provider: unknown);
  }
}

declare module 'react-native/Libraries/Utilities/dismissKeyboard' {
  const dismissKeyboard: () => void;
  export default dismissKeyboard;
}

declare module '@metamask/react-native-button/coalesceNonElementChildren' {
  const coalesceNonElementChildren: (
    children: React.ReactNode,
    callback: (child: React.ReactNode, index: number) => React.ReactNode,
  ) => React.ReactNode[];
  export default coalesceNonElementChildren;
}

declare module '@metamask/react-native-button' {
  import type {
    StyleProp,
    TextStyle,
    TouchableOpacityProps,
    ViewStyle,
  } from 'react-native';

  interface ButtonProps extends TouchableOpacityProps {
    accessibilityLabel?: string;
    allowFontScaling?: boolean;
    containerStyle?: StyleProp<ViewStyle>;
    disabledContainerStyle?: StyleProp<ViewStyle>;
    style?: StyleProp<TextStyle>;
    styleDisabled?: StyleProp<TextStyle>;
    childGroupStyle?: StyleProp<ViewStyle>;
  }

  const Button: React.ComponentType<
    React.PropsWithChildren<ButtonProps>
  >;
  export default Button;
}

declare module 'react-native-progress/Bar' {
  const ProgressBar: React.ComponentType<{
    progress?: number;
    color?: string;
    width?: number | null;
    height?: number;
    borderRadius?: number;
    borderWidth?: number;
    useNativeDriver?: boolean;
  }>;
  export default ProgressBar;
}
