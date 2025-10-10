import { WORD_IMAGES, WORD_THUMBNAIL_IMAGES } from '../constants/words';

export const resolveImageSource = (imageKey: string | null | undefined, useThumbnail: boolean = false) => {
  if (!imageKey) {
    return WORD_IMAGES['ball'];
  }

  if (imageKey.startsWith('file://')) {
    return { uri: imageKey };
  }

  const bundledImage = useThumbnail ? WORD_THUMBNAIL_IMAGES[imageKey] : WORD_IMAGES[imageKey];

  if (bundledImage) {
    return bundledImage;
  }

  return WORD_IMAGES['ball'];
};