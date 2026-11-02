import React, { useMemo } from 'react';
import { Image, View } from 'react-native';
import Badge, {
  BadgeVariant,
} from '../../../../../component-library/components/Badges/Badge';
import BadgeWrapper, {
  BadgePosition,
} from '../../../../../component-library/components/Badges/BadgeWrapper';
import { ModalHeaderNFTImage } from '../../../../../util/notifications/notification-states/types/NotificationModalDetails';
import RemoteImage from '../../../../Base/RemoteImage';
import { useShouldDisplayNftMedia } from '../../../../../util/notifications/hooks/useShouldDisplayNftMedia';
import NftFallbackImage from '../../../../../../docs/assets/nft-fallback.png';
import useStyles from '../useStyles';

type NFTImageHeaderProps = ModalHeaderNFTImage;

export default function NFTImageHeader(props: NFTImageHeaderProps) {
  const { styles } = useStyles();
  const showNftMedia = useShouldDisplayNftMedia(props.nftImageUrl);

  const badgeSource = useMemo(() => {
    const networkUrl = props.networkBadgeUrl;
    if (typeof networkUrl === 'string') {
      return { uri: networkUrl };
    }
    return networkUrl;
  }, [props.networkBadgeUrl]);

  return (
    <View style={styles.headerImageContainer}>
      {/* Collection Icon + Network Badge */}
      <BadgeWrapper
        badgePosition={BadgePosition.BottomRight}
        badgeElement={
          <Badge
            testID={'badge-element'}
            variant={BadgeVariant.Network}
            imageSource={badgeSource}
            style={styles.customBadgePosition}
          />
        }
        style={styles.badgeWrapper}
      >
        {showNftMedia ? (
          <RemoteImage
            source={{ uri: props.nftImageUrl }}
            style={styles.squareLogoLarge}
            placeholderStyle={styles.squareLogoLargePlaceholder}
          />
        ) : (
          <Image
            testID={'nft-image-header-fallback'}
            source={NftFallbackImage}
            style={styles.squareLogoLarge}
          />
        )}
      </BadgeWrapper>
    </View>
  );
}
