import { WORD_IMAGES } from '../constants/words';

export const resolveImageSource = (imageKey: string | null | undefined) => {
  if (!imageKey) {
    return WORD_IMAGES['ball'];
  }

  if (imageKey.startsWith('file://')) {
    return { uri: imageKey };
  }

  const bundledImage = WORD_IMAGES[imageKey];

  if (bundledImage) {
    return bundledImage;
  }

  return WORD_IMAGES['ball'];
};