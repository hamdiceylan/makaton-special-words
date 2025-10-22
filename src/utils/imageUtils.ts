import * as FileSystem from 'expo-file-system/legacy';
import { WORD_IMAGES } from '../constants/words';

export const WORD_IMAGE_DIRECTORY = 'word-images';
export const DEFAULT_IMAGE_KEY = 'ball';
const FALLBACK_EXTENSION = 'jpg';
const PERSISTENT_IMAGE_SCHEME = 'app-doc://';

const getDocumentDirectory = () => {
  const dir = FileSystem.documentDirectory;
  return typeof dir === 'string' ? dir : null;
};

const ensureWordImageDirAsync = async () => {
  const baseDir = getDocumentDirectory();
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

const buildPersistentKey = (relativePath: string) => `${PERSISTENT_IMAGE_SCHEME}${relativePath}`;

const getRelativePathFromUri = (uri: string) => {
  const marker = `/${WORD_IMAGE_DIRECTORY}/`;
  const markerIndex = uri.indexOf(marker);
  if (markerIndex >= 0) {
    const relative = uri.slice(markerIndex + 1);
    return relative.replace(/^\/+/, '');
  }
  return null;
};

const getRelativePathFromDocumentUri = (uri: string) => {
  const baseDir = getDocumentDirectory();
  if (baseDir && uri.startsWith(baseDir)) {
    const relative = uri.slice(baseDir.length).replace(/^\/+/, '');
    if (relative.startsWith(`${WORD_IMAGE_DIRECTORY}/`)) {
      return relative;
    }
  }
  return getRelativePathFromUri(uri);
};

const getAbsoluteUriFromPersistentKey = (key: string) => {
  if (!isPersistentImageKey(key)) {
    return null;
  }
  const baseDir = getDocumentDirectory();
  if (!baseDir) {
    return null;
  }
  const relative = key.slice(PERSISTENT_IMAGE_SCHEME.length).replace(/^\/+/, '');
  return `${baseDir}${relative}`;
};

export const isPersistentImageKey = (key: string | null | undefined): key is string =>
  typeof key === 'string' && key.startsWith(PERSISTENT_IMAGE_SCHEME);

export const normalizeImageStorageKey = (key: string | null | undefined): string | null => {
  if (!key) {
    return null;
  }

  if (isPersistentImageKey(key)) {
    return key;
  }
  const stringKey = key as string;

  if (stringKey.startsWith(`${WORD_IMAGE_DIRECTORY}/`)) {
    return buildPersistentKey(stringKey);
  }

  if (stringKey.startsWith('file://')) {
    const relative = getRelativePathFromDocumentUri(stringKey);
    if (relative) {
      return buildPersistentKey(relative);
    }
  }

  return stringKey;
};

export const resolveImageSource = (imageKey: string | null | undefined) => {
  const normalizedKey = normalizeImageStorageKey(imageKey);

  if (!normalizedKey) {
    return WORD_IMAGES[DEFAULT_IMAGE_KEY];
  }

  if (isPersistentImageKey(normalizedKey)) {
    const absoluteUri = getAbsoluteUriFromPersistentKey(normalizedKey);
    if (absoluteUri) {
      return { uri: absoluteUri };
    }
  }

  if (normalizedKey.startsWith('file://')) {
    return { uri: normalizedKey };
  }

  const bundledImage = WORD_IMAGES[normalizedKey];
  if (bundledImage) {
    return bundledImage;
  }

  if (normalizedKey.startsWith(`${WORD_IMAGE_DIRECTORY}/`)) {
    const absoluteUri = getAbsoluteUriFromPersistentKey(buildPersistentKey(normalizedKey));
    if (absoluteUri) {
      return { uri: absoluteUri };
    }
  }

  return WORD_IMAGES[DEFAULT_IMAGE_KEY];
};

export const copyImageToPersistentStorage = async (uri: string | null | undefined) => {
  if (!uri) {
    return null;
  }

  if (isPersistentImageKey(uri)) {
    return uri;
  }

  const normalizedExisting = normalizeImageStorageKey(uri);
  if (normalizedExisting && normalizedExisting !== uri && isPersistentImageKey(normalizedExisting)) {
    return normalizedExisting;
  }

  const fileUri = uri as string;

  if (!fileUri.startsWith('file://')) {
    return uri;
  }

  const targetDir = await ensureWordImageDirAsync();
  if (!targetDir) {
    return normalizedExisting ?? uri;
  }

  try {
    const extension = extractExtension(fileUri);
    const fileName = generateFileName(extension);
    const destinationRelative = `${WORD_IMAGE_DIRECTORY}/${fileName}`;
    const destinationAbsolute = `${targetDir}${fileName}`;

    await FileSystem.copyAsync({ from: fileUri, to: destinationAbsolute });
    return buildPersistentKey(destinationRelative);
  } catch {
    // If copying fails, fall back to existing or original URI
    return normalizedExisting ?? uri;
  }
};
