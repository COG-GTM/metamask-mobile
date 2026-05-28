// This file contains type declarations for asset types.
// Ex. This makes it so that when you import CloseIcon from './close-icon.svg, CloseIcon, will be detected as a React.FC component.
// TODO: Once all PropTypes usage is eliminated from the codebase (~148 files still use prop-types),
// remove prop-types from package.json dependencies.
declare module '*.mp4' {
  const source: number;
  export default source;
}

declare module '@metamask/react-native-payments/lib/js/__mocks__' {
  interface MockReactNative {
    Platform: { OS: string };
    DeviceEventEmitter: {
      removeSubscription: () => void;
      addListener: () => void;
    };
  }

  interface MockNativePayments {
    canMakePayments: boolean;
    createPaymentRequest: () => void;
    handleDetailsUpdate: () => void;
    show: (cb: () => void) => void;
    abort: (cb: () => void) => void;
    complete: (paymentStatus: unknown, cb: () => void) => void;
  }

  export const mockReactNativeIOS: MockReactNative;
  export const mockReactNativeAndroid: MockReactNative;
  export const mockNativePaymentsSupportedIOS: MockNativePayments;
  export const mockNativePaymentsUnsupportedIOS: MockNativePayments;
}

declare module 'react-native-fade-in-image' {
  import { Component } from 'react';
  import { ViewProps, StyleProp, ViewStyle } from 'react-native';

  interface FadeInProps extends ViewProps {
    placeholderStyle?: StyleProp<ViewStyle>;
    renderPlaceholderContent?: React.ReactNode;
    useNativeDriver?: boolean;
    children: React.ReactElement;
  }

  export default class FadeIn extends Component<FadeInProps> {}
}

declare module 'react-native-fast-crypto' {
  export function scrypt(
    passwd: Uint8Array,
    salt: Uint8Array,
    N: number,
    r: number,
    p: number,
    size: number,
  ): Promise<Uint8Array>;

  export const secp256k1: {
    publicKeyCreate(
      privateKey: Uint8Array,
      compressed: boolean,
    ): Promise<Uint8Array>;
    privateKeyTweakAdd(
      privateKey: Uint8Array,
      tweak: Uint8Array,
    ): Promise<Uint8Array>;
    publicKeyTweakAdd(
      publicKey: Uint8Array,
      tweak: Uint8Array,
      compressed: boolean,
    ): Promise<Uint8Array>;
  };

  export const pbkdf2: {
    deriveAsync(
      data: Uint8Array,
      salt: Uint8Array,
      iterations: number,
      size: number,
      alg: string,
    ): Promise<Uint8Array>;
  };
}

declare module 'xhr2' {
  export class XMLHttpRequest {
    readonly UNSENT: 0;
    readonly OPENED: 1;
    readonly HEADERS_RECEIVED: 2;
    readonly LOADING: 3;
    readonly DONE: 4;

    readyState: number;
    status: number;
    statusText: string;
    responseText: string;
    responseType: string;
    response: unknown;
    responseURL: string;
    timeout: number;
    withCredentials: boolean;

    onreadystatechange: ((this: XMLHttpRequest, ev: ProgressEvent) => void) | null;
    onload: ((this: XMLHttpRequest, ev: ProgressEvent) => void) | null;
    onerror: ((this: XMLHttpRequest, ev: ProgressEvent) => void) | null;
    onabort: ((this: XMLHttpRequest, ev: ProgressEvent) => void) | null;
    ontimeout: ((this: XMLHttpRequest, ev: ProgressEvent) => void) | null;
    onloadstart: ((this: XMLHttpRequest, ev: ProgressEvent) => void) | null;
    onloadend: ((this: XMLHttpRequest, ev: ProgressEvent) => void) | null;
    onprogress: ((this: XMLHttpRequest, ev: ProgressEvent) => void) | null;

    open(method: string, url: string, async?: boolean, user?: string | null, password?: string | null): void;
    setRequestHeader(header: string, value: string): void;
    send(data?: string | Buffer | ArrayBufferView | null): void;
    abort(): void;
    getResponseHeader(header: string): string | null;
    getAllResponseHeaders(): string;
    addEventListener(type: string, listener: (ev: ProgressEvent) => void): void;
    removeEventListener(type: string, listener: (ev: ProgressEvent) => void): void;

    static readonly XMLHttpRequestUpload: typeof XMLHttpRequestUpload;
  }

  class XMLHttpRequestUpload {
    onprogress: ((this: XMLHttpRequestUpload, ev: ProgressEvent) => void) | null;
    onload: ((this: XMLHttpRequestUpload, ev: ProgressEvent) => void) | null;
    onerror: ((this: XMLHttpRequestUpload, ev: ProgressEvent) => void) | null;
    onabort: ((this: XMLHttpRequestUpload, ev: ProgressEvent) => void) | null;
    ontimeout: ((this: XMLHttpRequestUpload, ev: ProgressEvent) => void) | null;
    onloadstart: ((this: XMLHttpRequestUpload, ev: ProgressEvent) => void) | null;
    onloadend: ((this: XMLHttpRequestUpload, ev: ProgressEvent) => void) | null;
    addEventListener(type: string, listener: (ev: ProgressEvent) => void): void;
    removeEventListener(type: string, listener: (ev: ProgressEvent) => void): void;
  }
}
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

declare module '@metamask/react-native-search-api' {
  import { NativeEventEmitter } from 'react-native';

  interface SpotlightItem {
    title: string;
    contentDescription?: string;
    uniqueIdentifier: string;
    domain?: string;
    keywords?: string[];
    thumbnailURL?: string;
  }

  interface AppHistoryItem {
    title: string;
    contentDescription?: string;
    userInfo: Record<string, unknown>;
    keywords?: string[];
    eligibleForPublicIndexing?: boolean;
    expirationDate?: Date;
    webpageURL?: string;
  }

  class SearchApi extends NativeEventEmitter {
    addOnSpotlightItemOpenEventListener(listener: (uniqueIdentifier: string) => void): void;
    removeOnSpotlightItemOpenEventListener(listener: (uniqueIdentifier: string) => void): void;
    addOnAppHistoryItemOpenEventListener(listener: (userInfo: Record<string, unknown>) => void): void;
    removeOnAppHistoryItemOpenEventListener(listener: (userInfo: Record<string, unknown>) => void): void;
    indexSpotlightItem(item: SpotlightItem): Promise<void>;
    indexSpotlightItems(items: SpotlightItem[]): Promise<void>;
    deleteSpotlightItemsWithIdentifiers(identifiers: string[]): Promise<void>;
    deleteSpotlightItemsInDomains(domains: string[]): Promise<void>;
    deleteAllSpotlightItems(): Promise<void>;
    indexAppHistoryItem(item: AppHistoryItem): Promise<void>;
  }

  const searchApi: SearchApi;
  export default searchApi;
}

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
