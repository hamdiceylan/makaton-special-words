import * as FileSystem from 'expo-file-system/legacy';
import { WORD_IMAGES } from '../constants/words';

const WORD_IMAGE_DIRECTORY = 'word-images';
const DEFAULT_IMAGE_KEY = 'ball';
const FALLBACK_EXTENSION = 'jpg';

const ensureWordImageDirAsync = async () => {
  const baseDir = FileSystem.documentDirectory;
  if (!baseDir) {
    return null;
  }

  const targetDir = `${baseDir}${WORD_IMAGE_DIRECTORY}`;
  try {
    await FileSystem.makeDirectoryAsync(targetDir, { intermediates: true });
  } catch (error: any) {
    // Ignore "directory already exists" errors
    if (error?.code !== 'E_DIR_EXISTS') {
      throw error;
    }
  }
  return targetDir.endsWith('/') ? targetDir : `${targetDir}/`;
};

const generateFileName = (extension: string) => {
  const safeExt = extension.replace(/[^a-z0-9]/gi, '').toLowerCase() || FALLBACK_EXTENSION;
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 8);
  return `${timestamp}-${random}.${safeExt}`;
};

const extractExtension = (uri: string) => {
  try {
    const withoutQuery = uri.split('?')[0] ?? '';
    const match = withoutQuery.match(/\.([a-zA-Z0-9]+)$/);
    return match ? match[1] : FALLBACK_EXTENSION;
  } catch {
    return FALLBACK_EXTENSION;
  }
};

export const resolveImageSource = (imageKey: string | null | undefined) => {
  if (!imageKey) {
    return WORD_IMAGES[DEFAULT_IMAGE_KEY];
  }

  if (imageKey.startsWith('file://')) {
    return { uri: imageKey };
  }

  const bundledImage = WORD_IMAGES[imageKey];

  if (bundledImage) {
    return bundledImage;
  }

  return WORD_IMAGES[DEFAULT_IMAGE_KEY];
};

export const copyImageToPersistentStorage = async (uri: string | null | undefined) => {
  if (typeof uri !== 'string' || !uri.startsWith('file://')) {
    return uri ?? null;
  }

  const baseDir = FileSystem.documentDirectory;
  if (!baseDir) {
    return uri;
  }

  // Already in our document directory
  if (uri.startsWith(baseDir)) {
    return uri;
  }

  try {
    const targetDir = await ensureWordImageDirAsync();
    if (!targetDir) {
      return uri;
    }

    const extension = extractExtension(uri);
    const fileName = generateFileName(extension);
    const destination = `${targetDir}${fileName}`;

    await FileSystem.copyAsync({ from: uri, to: destination });
    return destination;
  } catch {
    // If copying fails, keep the original URI so the user isn't blocked
    return uri;
  }
};
