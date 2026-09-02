declare module 'react-native/Libraries/Image/resolveAssetSource' {
  import { ImageSourcePropType } from 'react-native';

  export interface ResolvedAssetSource {
    uri?: string;
    width?: number;
    height?: number;
    scale?: number;
    __packager_asset?: boolean;
  }

  export default function resolveAssetSource(
    source?: ImageSourcePropType,
  ): ResolvedAssetSource;
}
