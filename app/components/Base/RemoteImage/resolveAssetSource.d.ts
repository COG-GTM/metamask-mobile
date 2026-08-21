declare module 'react-native/Libraries/Image/resolveAssetSource' {
  import { ImageSourcePropType } from 'react-native';

  export interface ResolvedAssetSource {
    __packager_asset?: boolean;
    height?: number;
    width?: number;
    scale?: number;
    uri?: string;
  }

  export default function resolveAssetSource(
    source: ImageSourcePropType | string | undefined,
  ): ResolvedAssetSource;
}
