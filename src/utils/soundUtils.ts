import { AudioModule, createAudioPlayer, setAudioModeAsync, setIsAudioActiveAsync } from 'expo-audio';
import * as FileSystem from 'expo-file-system/legacy';
import * as Speech from 'expo-speech';

const URI_SCHEME_REGEX = /^[a-zA-Z][a-zA-Z0-9+\-.]*:\/\//;
const SOUND_DIRECTORY = 'word-sounds';
const PERSISTENT_SOUND_SCHEME = 'app-audio://';
const FALLBACK_SOUND_EXTENSION = 'm4a';

const getDocumentDirectory = () => {
  const dir = FileSystem.documentDirectory;
  return typeof dir === 'string' ? dir : null;
};

const ensureSoundDirectoryAsync = async () => {
  const baseDir = getDocumentDirectory();
  if (!baseDir) {
    return null;
  }

  const targetDir = `${baseDir}${SOUND_DIRECTORY}`;
  try {
    await FileSystem.makeDirectoryAsync(targetDir, { intermediates: true });
  } catch (error: any) {
    if (error?.code !== 'E_DIR_EXISTS') {
      throw error;
    }
  }
  return targetDir.endsWith('/') ? targetDir : `${targetDir}/`;
};

const buildPersistentSoundKey = (relativePath: string) =>
  `${PERSISTENT_SOUND_SCHEME}${relativePath.replace(/^\/+/, '')}`;

const extractSoundExtension = (uri: string) => {
  try {
    const withoutQuery = uri.split('?')[0] ?? '';
    const match = withoutQuery.match(/\.([a-zA-Z0-9]+)$/);
    return match ? match[1] : FALLBACK_SOUND_EXTENSION;
  } catch {
    return FALLBACK_SOUND_EXTENSION;
  }
};

const getRelativePathFromUri = (uri: string) => {
  const marker = `/${SOUND_DIRECTORY}/`;
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
    if (relative.startsWith(`${SOUND_DIRECTORY}/`)) {
      return relative;
    }
  }
  return getRelativePathFromUri(uri);
};

const resolvePersistentSoundUri = (key: string) => {
  if (!isPersistentSoundKey(key)) {
    return null;
  }
  const baseDir = getDocumentDirectory();
  if (!baseDir) {
    return null;
  }
  const relative = key.slice(PERSISTENT_SOUND_SCHEME.length).replace(/^\/+/, '');
  return `${baseDir}${relative}`;
};

export const isPersistentSoundKey = (value: string | null | undefined): value is string =>
  typeof value === 'string' && value.startsWith(PERSISTENT_SOUND_SCHEME);

export const normalizeSoundStorageKey = (value: string | null | undefined): string | null => {
  if (!value) {
    return null;
  }

  if (isPersistentSoundKey(value)) {
    return value;
  }

  const stringValue = value as string;

  if (URI_SCHEME_REGEX.test(stringValue)) {
    if (stringValue.startsWith('file://')) {
      const relative = getRelativePathFromDocumentUri(stringValue);
      if (relative) {
        return buildPersistentSoundKey(relative);
      }
    }
    return stringValue;
  }

  if (stringValue.startsWith('/')) {
    return `file://${stringValue}`;
  }

  return stringValue;
};

export const copySoundToPersistentStorage = async (uri: string | null | undefined) => {
  if (!uri) {
    return null;
  }

  const normalizedKey = normalizeSoundStorageKey(uri);
  if (normalizedKey && isPersistentSoundKey(normalizedKey)) {
    return normalizedKey;
  }

  const fileUri = typeof uri === 'string' ? uri : String(uri);
  if (!fileUri.startsWith('file://')) {
    return normalizedKey ?? fileUri;
  }

  const targetDir = await ensureSoundDirectoryAsync();
  if (!targetDir) {
    return normalizedKey ?? fileUri;
  }

  try {
    const extension = extractSoundExtension(fileUri);
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;
    const destinationRelative = `${SOUND_DIRECTORY}/${fileName}`;
    const destinationAbsolute = `${targetDir}${fileName}`;

    await FileSystem.copyAsync({ from: fileUri, to: destinationAbsolute });
    return buildPersistentSoundKey(destinationRelative);
  } catch {
    return normalizedKey ?? fileUri;
  }
};

export const normalizeSoundUri = (value: string | null | undefined): string | null => {
  if (!value) {
    return null;
  }
  if (isPersistentSoundKey(value)) {
    return resolvePersistentSoundUri(value) ?? value;
  }
  const stringValue = value as string;
  if (URI_SCHEME_REGEX.test(stringValue)) {
    if (stringValue.startsWith('file://')) {
      const relative = getRelativePathFromDocumentUri(stringValue);
      if (relative) {
        const resolved = resolvePersistentSoundUri(buildPersistentSoundKey(relative));
        return resolved ?? stringValue;
      }
    }
    return stringValue;
  }
  if (stringValue.startsWith('/')) {
    return `file://${stringValue}`;
  }
  return stringValue;
};

export const isLikelySoundUri = (value: string | null | undefined): value is string => {
  if (!value) {
    return false;
  }
  if (isPersistentSoundKey(value)) {
    return true;
  }
  const stringValue = value as string;
  if (stringValue.startsWith('/')) {
    return true;
  }
  return URI_SCHEME_REGEX.test(stringValue);
};

// Base sound mappings - React Native requires static paths
// Using a single object to avoid repetition
const SOUND_FILES = {
  ball: { enGB: require('../../assets/sounds/en-GB/child/ball.m4a'), tr: require('../../assets/sounds/tr/ball.m4a') },
  book: { enGB: require('../../assets/sounds/en-GB/child/book.m4a'), tr: require('../../assets/sounds/tr/book.m4a') },
  dolly: { enGB: require('../../assets/sounds/en-GB/child/dolly.m4a'), tr: require('../../assets/sounds/tr/dolly.m4a') },
  car: { enGB: require('../../assets/sounds/en-GB/child/car.m4a'), tr: require('../../assets/sounds/tr/car.m4a') },
  bird: { enGB: require('../../assets/sounds/en-GB/child/bird.m4a'), tr: require('../../assets/sounds/tr/bird.m4a') },
  dog: { enGB: require('../../assets/sounds/en-GB/child/dog.m4a'), tr: require('../../assets/sounds/tr/dog.m4a') },
  cat: { enGB: require('../../assets/sounds/en-GB/child/cat.m4a'), tr: require('../../assets/sounds/tr/cat.m4a') },
  fish: { enGB: require('../../assets/sounds/en-GB/child/fish.m4a'), tr: require('../../assets/sounds/tr/fish.m4a') },
  flower: { enGB: require('../../assets/sounds/en-GB/child/flower.m4a'), tr: require('../../assets/sounds/tr/flower.m4a') },
  keys: { enGB: require('../../assets/sounds/en-GB/child/keys.m4a'), tr: require('../../assets/sounds/tr/keys.m4a') },
  cup: { enGB: require('../../assets/sounds/en-GB/child/cup.m4a'), tr: require('../../assets/sounds/tr/cup.m4a') },
  brush: { enGB: require('../../assets/sounds/en-GB/child/brush.m4a'), tr: require('../../assets/sounds/tr/brush.m4a') },
  coat: { enGB: require('../../assets/sounds/en-GB/child/coat.m4a'), tr: require('../../assets/sounds/tr/coat.m4a') },
  shoes: { enGB: require('../../assets/sounds/en-GB/child/shoes.m4a'), tr: require('../../assets/sounds/tr/shoes.m4a') },
  hat: { enGB: require('../../assets/sounds/en-GB/child/hat.m4a'), tr: require('../../assets/sounds/tr/hat.m4a') },
  socks: { enGB: require('../../assets/sounds/en-GB/child/socks.m4a'), tr: require('../../assets/sounds/tr/socks.m4a') },
  duck: { enGB: require('../../assets/sounds/en-GB/child/duck.m4a'), tr: require('../../assets/sounds/tr/duck.m4a') },
  pig: { enGB: require('../../assets/sounds/en-GB/child/pig.m4a'), tr: require('../../assets/sounds/tr/pig.m4a') },
  sheep: { enGB: require('../../assets/sounds/en-GB/child/sheep.m4a'), tr: require('../../assets/sounds/tr/sheep.m4a') },
  cow: { enGB: require('../../assets/sounds/en-GB/child/cow.m4a'), tr: require('../../assets/sounds/tr/cow.m4a') },
  apple: { enGB: require('../../assets/sounds/en-GB/child/apple.m4a'), tr: require('../../assets/sounds/tr/apple.m4a') },
  banana: { enGB: require('../../assets/sounds/en-GB/child/banana.m4a'), tr: require('../../assets/sounds/tr/banana.m4a') },
  biscuit: { enGB: require('../../assets/sounds/en-GB/child/biscuit.m4a'), tr: require('../../assets/sounds/tr/biscuit.m4a') },
  drink: { enGB: require('../../assets/sounds/en-GB/child/drink.m4a'), tr: require('../../assets/sounds/tr/drink.m4a') },
  bed: { enGB: require('../../assets/sounds/en-GB/child/bed.m4a'), tr: require('../../assets/sounds/tr/bed.m4a') },
  chair: { enGB: require('../../assets/sounds/en-GB/child/chair.m4a'), tr: require('../../assets/sounds/tr/chair.m4a') },
  table: { enGB: require('../../assets/sounds/en-GB/child/table.m4a'), tr: require('../../assets/sounds/tr/table.m4a') },
  bath: { enGB: require('../../assets/sounds/en-GB/child/bath.m4a'), tr: require('../../assets/sounds/tr/bath.m4a') },
  eyes: { enGB: require('../../assets/sounds/en-GB/child/eyes.m4a'), tr: require('../../assets/sounds/tr/eyes.m4a') },
  mouth: { enGB: require('../../assets/sounds/en-GB/child/mouth.m4a'), tr: require('../../assets/sounds/tr/mouth.m4a') },
  hair: { enGB: require('../../assets/sounds/en-GB/child/hair.m4a'), tr: require('../../assets/sounds/tr/hair.m4a') },
  nose: { enGB: require('../../assets/sounds/en-GB/child/nose.m4a'), tr: require('../../assets/sounds/tr/nose.m4a') },
  spoon: { enGB: require('../../assets/sounds/en-GB/child/spoon.m4a'), tr: require('../../assets/sounds/tr/spoon.m4a') },
  bag: { enGB: require('../../assets/sounds/en-GB/child/bag.m4a'), tr: require('../../assets/sounds/tr/bag.m4a') },
  phone: { enGB: require('../../assets/sounds/en-GB/child/phone.m4a'), tr: require('../../assets/sounds/tr/phone.m4a') },
  bricks: { enGB: require('../../assets/sounds/en-GB/child/bricks.m4a'), tr: require('../../assets/sounds/tr/bricks.m4a') },
  eating: { enGB: require('../../assets/sounds/en-GB/child/eating.m4a'), tr: require('../../assets/sounds/tr/eating.m4a') },
  sleeping: { enGB: require('../../assets/sounds/en-GB/child/sleeping.m4a'), tr: require('../../assets/sounds/tr/sleeping.m4a') },
  drinking: { enGB: require('../../assets/sounds/en-GB/child/drinking.m4a'), tr: require('../../assets/sounds/tr/drinking.m4a') },
  brushing: { enGB: require('../../assets/sounds/en-GB/child/brushing.m4a'), tr: require('../../assets/sounds/tr/brushing.m4a') },
  sitting: { enGB: require('../../assets/sounds/en-GB/child/sitting.m4a'), tr: require('../../assets/sounds/tr/sitting.m4a') },
  washing: { enGB: require('../../assets/sounds/en-GB/child/washing.m4a'), tr: require('../../assets/sounds/tr/washing.m4a') },
  walking: { enGB: require('../../assets/sounds/en-GB/child/walking.m4a'), tr: require('../../assets/sounds/tr/walking.m4a') },
  crying: { enGB: require('../../assets/sounds/en-GB/child/crying.m4a'), tr: require('../../assets/sounds/tr/crying.m4a') },
  television: { enGB: require('../../assets/sounds/en-GB/child/television.m4a'), tr: require('../../assets/sounds/tr/television.m4a') },
  light: { enGB: require('../../assets/sounds/en-GB/child/light.m4a'), tr: require('../../assets/sounds/tr/light.m4a') },
  balloon: { enGB: require('../../assets/sounds/en-GB/child/balloon.m4a'), tr: require('../../assets/sounds/tr/balloon.m4a') },
  box: { enGB: require('../../assets/sounds/en-GB/child/box.m4a'), tr: require('../../assets/sounds/tr/box.m4a') },
  bubbles: { enGB: require('../../assets/sounds/en-GB/child/bubbles.m4a'), tr: require('../../assets/sounds/tr/bubbles.m4a') },
  big: { enGB: require('../../assets/sounds/en-GB/child/big.m4a'), tr: require('../../assets/sounds/tr/big.m4a') },
  splashing: { enGB: require('../../assets/sounds/en-GB/child/splashing.m4a'), tr: require('../../assets/sounds/tr/splashing.m4a') },
  little: { enGB: require('../../assets/sounds/en-GB/child/little.m4a'), tr: require('../../assets/sounds/tr/little.m4a') },
  garden: { enGB: require('../../assets/sounds/en-GB/child/garden.m4a'), tr: require('../../assets/sounds/tr/garden.m4a') },
  star: { enGB: require('../../assets/sounds/en-GB/child/star.m4a'), tr: require('../../assets/sounds/tr/star.m4a') },
  house: { enGB: require('../../assets/sounds/en-GB/child/house.m4a'), tr: require('../../assets/sounds/tr/house.m4a') },
  tree: { enGB: require('../../assets/sounds/en-GB/child/tree.m4a'), tr: require('../../assets/sounds/tr/tree.m4a') },
  jumping: { enGB: require('../../assets/sounds/en-GB/child/jumping.m4a'), tr: require('../../assets/sounds/tr/jumping.m4a') },
  playing: { enGB: require('../../assets/sounds/en-GB/child/playing.m4a'), tr: require('../../assets/sounds/tr/playing.m4a') },
  running: { enGB: require('../../assets/sounds/en-GB/child/running.m4a'), tr: require('../../assets/sounds/tr/running.m4a') },
  kissing: { enGB: require('../../assets/sounds/en-GB/child/kissing.m4a'), tr: require('../../assets/sounds/tr/kissing.m4a') },
  clapping: { enGB: require('../../assets/sounds/en-GB/child/clapping.m4a'), tr: require('../../assets/sounds/tr/clapping.m4a') },
  reading: { enGB: require('../../assets/sounds/en-GB/child/reading.m4a'), tr: require('../../assets/sounds/tr/reading.m4a') },
  cutting: { enGB: require('../../assets/sounds/en-GB/child/cutting.m4a'), tr: require('../../assets/sounds/tr/cutting.m4a') },
  throwing: { enGB: require('../../assets/sounds/en-GB/child/throwing.m4a'), tr: require('../../assets/sounds/tr/throwing.m4a') },
  towel: { enGB: require('../../assets/sounds/en-GB/child/towel.m4a'), tr: require('../../assets/sounds/tr/towel.m4a') },
  soap: { enGB: require('../../assets/sounds/en-GB/child/soap.m4a'), tr: require('../../assets/sounds/tr/soap.m4a') },
  toothbrush: { enGB: require('../../assets/sounds/en-GB/child/toothbrush.m4a'), tr: require('../../assets/sounds/tr/toothbrush.m4a') },
  teeth: { enGB: require('../../assets/sounds/en-GB/child/teeth.m4a'), tr: require('../../assets/sounds/tr/teeth.m4a') },
  bread: { enGB: require('../../assets/sounds/en-GB/child/bread.m4a'), tr: require('../../assets/sounds/tr/bread.m4a') },
  dinner: { enGB: require('../../assets/sounds/en-GB/child/dinner.m4a'), tr: require('../../assets/sounds/tr/dinner.m4a') },
  juice: { enGB: require('../../assets/sounds/en-GB/child/juice.m4a'), tr: require('../../assets/sounds/tr/juice.m4a') },
  yogurt: { enGB: require('../../assets/sounds/en-GB/child/yogurt.m4a'), tr: require('../../assets/sounds/tr/yogurt.m4a') },
  chicken: { enGB: require('../../assets/sounds/en-GB/child/chicken.m4a'), tr: require('../../assets/sounds/tr/chicken.m4a') },
  monkey: { enGB: require('../../assets/sounds/en-GB/child/monkey.m4a'), tr: require('../../assets/sounds/tr/monkey.m4a') },
  rabbit: { enGB: require('../../assets/sounds/en-GB/child/rabbit.m4a'), tr: require('../../assets/sounds/tr/rabbit.m4a') },
  horse: { enGB: require('../../assets/sounds/en-GB/child/horse.m4a'), tr: require('../../assets/sounds/tr/horse.m4a') },
  dress: { enGB: require('../../assets/sounds/en-GB/child/dress.m4a'), tr: require('../../assets/sounds/tr/dress.m4a') },
  jumper: { enGB: require('../../assets/sounds/en-GB/child/jumper.m4a'), tr: require('../../assets/sounds/tr/jumper.m4a') },
  boots: { enGB: require('../../assets/sounds/en-GB/child/boots.m4a'), tr: require('../../assets/sounds/tr/boots.m4a') },
  trousers: { enGB: require('../../assets/sounds/en-GB/child/trousers.m4a'), tr: require('../../assets/sounds/tr/trousers.m4a') },
  foot: { enGB: require('../../assets/sounds/en-GB/child/foot.m4a'), tr: require('../../assets/sounds/tr/foot.m4a') },
  tummy: { enGB: require('../../assets/sounds/en-GB/child/tummy.m4a'), tr: require('../../assets/sounds/tr/tummy.m4a') },
  hand: { enGB: require('../../assets/sounds/en-GB/child/hand.m4a'), tr: require('../../assets/sounds/tr/hand.m4a') },
  ear: { enGB: require('../../assets/sounds/en-GB/child/ear.m4a'), tr: require('../../assets/sounds/tr/ear.m4a') },
  up: { enGB: require('../../assets/sounds/en-GB/child/up.m4a'), tr: require('../../assets/sounds/tr/up.m4a') },
  down: { enGB: require('../../assets/sounds/en-GB/child/down.m4a'), tr: require('../../assets/sounds/tr/down.m4a') },
  swing: { enGB: require('../../assets/sounds/en-GB/child/swing.m4a'), tr: require('../../assets/sounds/tr/swing.m4a') },
  bike: { enGB: require('../../assets/sounds/en-GB/child/bike.m4a'), tr: require('../../assets/sounds/tr/bike.m4a') },
  boat: { enGB: require('../../assets/sounds/en-GB/child/boat.m4a'), tr: require('../../assets/sounds/tr/boat.m4a') },
  bus: { enGB: require('../../assets/sounds/en-GB/child/bus.m4a'), tr: require('../../assets/sounds/tr/bus.m4a') },
  aeroplane: { enGB: require('../../assets/sounds/en-GB/child/aeroplane.m4a'), tr: require('../../assets/sounds/tr/aeroplane.m4a') },
  train: { enGB: require('../../assets/sounds/en-GB/child/train.m4a'), tr: require('../../assets/sounds/tr/train.m4a') },
  wet: { enGB: require('../../assets/sounds/en-GB/child/wet.m4a'), tr: require('../../assets/sounds/tr/wet.m4a') },
  dirty: { enGB: require('../../assets/sounds/en-GB/child/dirty.m4a'), tr: require('../../assets/sounds/tr/dirty.m4a') },
  hot: { enGB: require('../../assets/sounds/en-GB/child/hot.m4a'), tr: require('../../assets/sounds/tr/hot.m4a') },
  cold: { enGB: require('../../assets/sounds/en-GB/child/cold.m4a'), tr: require('../../assets/sounds/tr/cold.m4a') },
};

// Extract locale-specific mappings
const EN_GB_SOUNDS: { [key: string]: any } = {};
const TR_SOUNDS: { [key: string]: any } = {};

Object.entries(SOUND_FILES).forEach(([word, sounds]) => {
  EN_GB_SOUNDS[word] = sounds.enGB;
  TR_SOUNDS[word] = sounds.tr;
});

/**
 * Get sound mapping for a specific locale
 * @param locale - The locale code (e.g., 'en-GB', 'tr', 'en')
 * @returns Sound mapping for the locale, or default (en-GB) if not found
 */
export const getWordSounds = (locale?: string): { [key: string]: any } => {
  if (!locale) return EN_GB_SOUNDS;
  
  // Exact match
  if (locale === 'tr') return TR_SOUNDS;
  if (locale === 'en-GB') return EN_GB_SOUNDS;
  
  // Language code match (e.g., 'en' -> 'en-GB')
  const langCode = locale.split('-')[0];
  if (langCode === 'tr') return TR_SOUNDS;
  if (langCode === 'en') return EN_GB_SOUNDS;
  
  // Default fallback
  return EN_GB_SOUNDS;
};

// Legacy export for backward compatibility
export const WORD_SOUNDS = EN_GB_SOUNDS;

// Reward sound for successful matches
export const REWARD_SOUND = require('../../assets/sounds/_Reward_.m4a');

// Sound instance tracking to prevent multiple instances
let currentSoundInstance: InstanceType<typeof AudioModule.AudioPlayer> | null = null;

type AudioPlayerInstance = InstanceType<typeof AudioModule.AudioPlayer>;

const disposeAudioPlayer = (
  player: AudioPlayerInstance | null,
  options: { deactivate?: boolean } = {}
) => {
  if (!player) {
    return;
  }
  try {
    player.pause();
  } catch {}
  try {
    player.remove();
  } catch {}
  try {
    player.release();
  } catch {}

  if (options.deactivate) {
    setIsAudioActiveAsync(false).catch(() => {});
  }
};

/**
 * Initialize audio settings
 */
export const initializeAudio = async () => {
  try {
    await setAudioModeAsync({
      allowsRecording: false,
      playsInSilentMode: true,
      shouldPlayInBackground: false,
      interruptionModeAndroid: 'duckOthers',
      shouldRouteThroughEarpiece: false,
      interruptionMode: 'mixWithOthers',
    });
  } catch (error) {
    console.warn('Failed to initialize audio:', error);
  }
};

/**
 * Stop any currently playing sound
 */
export const stopCurrentSound = async () => {
  if (currentSoundInstance) {
    disposeAudioPlayer(currentSoundInstance);
    currentSoundInstance = null;
  }
};

/** Stop TTS if speaking */
export const stopCurrentSpeech = async () => {
  try {
    Speech.stop();
  } catch (error) {
    // ignore
  }
};

/**
 * Play a word sound
 * @param wordKey - The word key (e.g., 'ball', 'cat')
 * @param locale - Optional locale for sound selection
 */
export const playWordSound = async (wordKey: string, locale?: string) => {
  try {
    // Stop any currently playing sound
    await stopCurrentSound();
    await stopCurrentSpeech();
    await setIsAudioActiveAsync(true);

    const wordSounds = getWordSounds(locale);
    const soundSource = wordSounds[wordKey];
    if (!soundSource) {
      console.warn(`No sound found for word: ${wordKey} in locale: ${locale}`);
      return;
    }

    const player = createAudioPlayer(soundSource, { keepAudioSessionActive: true });
    currentSoundInstance = player;
    let attemptedRestart = false;
    player.play();
    const sub = player.addListener('playbackStatusUpdate', (status: any) => {
      if (status?.isLoaded && !status?.playing && status?.currentTime === 0 && !attemptedRestart) {
        attemptedRestart = true;
        try { player.play(); } catch {}
      }
      if (status?.isLoaded && status?.didJustFinish) {
        disposeAudioPlayer(player, { deactivate: true });
        if (currentSoundInstance === player) {
          currentSoundInstance = null;
        }
        sub.remove();
      }
    });
  } catch (error) {
    console.warn(`Error playing sound for ${wordKey}:`, error);
  }
};

/**
 * Play a word sound and resolve when playback finishes. Ensures a minimum wait if provided.
 */
export const playWordAndWait = async (
  wordKey: string,
  options?: { ttsEnabled?: boolean; locale?: string; text?: string },
  minWaitMs: number = 0
): Promise<void> => {
  const minWaitPromise = new Promise<void>((resolve) => setTimeout(resolve, Math.max(0, minWaitMs)));

  // Empty or missing key → TTS (if enabled); otherwise just wait min
  if (!wordKey || wordKey.trim() === '') {
    if (options?.ttsEnabled) {
      try {
        await stopCurrentSound();
        await stopCurrentSpeech();
        const speakText = options.text ?? '';
        if (speakText) {
          await setIsAudioActiveAsync(true);
          await new Promise<void>((resolve) => {
            Speech.speak(speakText, {
              language: options.locale,
              rate: 1.0,
              pitch: 1.0,
              onDone: () => resolve(),
              onStopped: () => resolve(),
              onError: (_e: any) => resolve(),
            });
          });
        }
      } catch {}
    }
    await minWaitPromise;
    return;
  }

  const normalizedUri = normalizeSoundUri(wordKey);

  // Local or remote custom file (not an image)
  if (normalizedUri && isLikelySoundUri(normalizedUri) && !normalizedUri.match(/\.(png|jpg|jpeg|gif|bmp|webp)$/i)) {
    try {
      await stopCurrentSound();
      await stopCurrentSpeech();
      await setIsAudioActiveAsync(true);

      const player = createAudioPlayer({ uri: normalizedUri }, { keepAudioSessionActive: true });
      currentSoundInstance = player;
      const finishedPromise = new Promise<void>((resolve) => {
        const sub = player.addListener('playbackStatusUpdate', (status: any) => {
          if (status?.isLoaded && status?.didJustFinish) {
            disposeAudioPlayer(player, { deactivate: true });
            if (currentSoundInstance === player) currentSoundInstance = null;
            sub.remove();
            resolve();
          }
        });
      });
      player.play();
      await Promise.all([finishedPromise, minWaitPromise]);
      return;
    } catch (error) {
      // Fall through to TTS fallback below
    }
  }

  // Bundled recording
  const wordSounds = getWordSounds(options?.locale);
  if (wordSounds[wordKey]) {
    try {
      await stopCurrentSound();
      await stopCurrentSpeech();
      await setIsAudioActiveAsync(true);
      const player = createAudioPlayer(wordSounds[wordKey], { keepAudioSessionActive: true });
      currentSoundInstance = player;
      const finishedPromise = new Promise<void>((resolve) => {
        const sub = player.addListener('playbackStatusUpdate', (status: any) => {
          if (status?.isLoaded && status?.didJustFinish) {
            disposeAudioPlayer(player, { deactivate: true });
            if (currentSoundInstance === player) currentSoundInstance = null;
            sub.remove();
            resolve();
          }
        });
      });
      player.play();
      await Promise.all([finishedPromise, minWaitPromise]);
      return;
    } catch (error) {
      // Fall through to TTS fallback
    }
  }

  // Fallback to TTS if enabled; otherwise just wait minimum
  if (options?.ttsEnabled) {
    try {
      const speakText = options.text ?? wordKey;
      await new Promise<void>((resolve) => {
        Speech.speak(speakText, {
          language: options.locale,
          rate: 1.0,
          pitch: 1.0,
          onDone: () => resolve(),
          onStopped: () => resolve(),
          onError: (_e: any) => resolve(),
        });
      });
    } catch {}
  }
  await minWaitPromise;
};

/**
 * Play a word using recorded sound if available; otherwise fall back to TTS if enabled.
 */
export const playWord = async (
  wordKey: string,
  options?: { ttsEnabled?: boolean; locale?: string; text?: string }
) => {
  // Handle null, undefined, or empty wordKey - fall back to TTS
  if (!wordKey || wordKey.trim() === '') {
    if (options?.ttsEnabled) {
      try {
        await stopCurrentSound();
        await stopCurrentSpeech();
        const speakText = options.text ?? '';
        if (speakText) {
          Speech.speak(speakText, {
            language: options.locale,
            rate: 1.0,
            pitch: 1.0,
          });
        }
      } catch (error) {
        console.warn('TTS speak error:', error);
      }
    }
    return;
  }

  // Check if it's a custom sound file (URI or absolute path) and not an image
  const normalizedUri = normalizeSoundUri(wordKey);
  if (normalizedUri && isLikelySoundUri(normalizedUri) && !normalizedUri.match(/\.(png|jpg|jpeg|gif|bmp|webp)$/i)) {
    try {
      await stopCurrentSound();
      await stopCurrentSpeech();
      await setIsAudioActiveAsync(true);
      
      const player = createAudioPlayer({ uri: normalizedUri }, { keepAudioSessionActive: true });
      currentSoundInstance = player;
      let attemptedRestart = false;
      player.play();
      const sub = player.addListener('playbackStatusUpdate', (status: any) => {
        if (status?.isLoaded && !status?.playing && status?.currentTime === 0 && !attemptedRestart) {
          attemptedRestart = true;
          try { player.play(); } catch {}
        }
        if (status?.isLoaded && status?.didJustFinish) {
          disposeAudioPlayer(player, { deactivate: true });
          if (currentSoundInstance === player) {
            currentSoundInstance = null;
          }
          sub.remove();
        }
      });
      return;
    } catch (error) {
      console.warn(`Error playing custom sound for ${wordKey}:`, error);
      // Fall back to TTS if custom sound fails
      if (options?.ttsEnabled) {
        try {
          const speakText = options.text ?? wordKey;
          Speech.speak(speakText, {
            language: options.locale,
            rate: 1.0,
            pitch: 1.0,
          });
        } catch (ttsError) {
          console.warn('TTS speak error:', ttsError);
        }
      }
      return;
    }
  }

  // Check for bundled sound
  const wordSounds = getWordSounds(options?.locale);
  const hasRecording = Boolean(wordSounds[wordKey]);
  if (hasRecording) {
    await playWordSound(wordKey, options?.locale);
    return;
  }
  
  // Fall back to TTS if enabled
  if (options?.ttsEnabled) {
    try {
      await stopCurrentSound();
      await stopCurrentSpeech();
      const speakText = options.text ?? wordKey;
      Speech.speak(speakText, {
        language: options.locale,
        rate: 1.0,
        pitch: 1.0,
      });
    } catch (error) {
      console.warn('TTS speak error:', error);
    }
  }
};

/**
 * Play the reward sound for successful matches
 */
export const playRewardSound = async (): Promise<void> => {
  try {
    await stopCurrentSound();
    await stopCurrentSpeech();
    await setIsAudioActiveAsync(true);
    const player = createAudioPlayer(REWARD_SOUND);
    currentSoundInstance = player;
    player.play();
    await new Promise<void>((resolve) => {
      const sub = player.addListener('playbackStatusUpdate', (status: any) => {
        if (status?.isLoaded && status?.didJustFinish) {
          disposeAudioPlayer(player, { deactivate: true });
          if (currentSoundInstance === player) {
            currentSoundInstance = null;
          }
          sub.remove();
          resolve();
        }
      });
    });
  } catch (error) {
    console.warn('Error playing reward sound:', error);
  }
};
