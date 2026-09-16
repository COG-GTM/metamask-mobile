import 'react-native-webview-invoke/factory';

declare module 'react-native-webview-invoke/factory' {
  interface IMessager {
    defineAsync<Args extends unknown[]>(
      name: string,
      func: (...args: Args) => Promise<unknown>,
    ): void;
    bindAsync(name: string): (...args: unknown[]) => Promise<unknown>;
  }
}
