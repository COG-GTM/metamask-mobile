declare module 'react-native/Libraries/Image/resolveAssetSource' {
  import { ImageResolvedAssetSource, ImageSourcePropType } from 'react-native';

  export interface ResolvedAssetSource extends ImageResolvedAssetSource {
    __packager_asset?: boolean;
  }

  export default function resolveAssetSource(
    source: ImageSourcePropType | undefined,
  ): ResolvedAssetSource | null;
}
