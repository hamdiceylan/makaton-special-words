import { AudioModule, createAudioPlayer, setAudioModeAsync, setIsAudioActiveAsync } from 'expo-audio';
import * as Speech from 'expo-speech';

// Sound mapping for words - using en-GB/child directory for child voices
export const WORD_SOUNDS: { [key: string]: any } = {
  'ball': require('../../assets/sounds/en-GB/child/ball.m4a'),
  'book': require('../../assets/sounds/en-GB/child/book.m4a'),
  'dolly': require('../../assets/sounds/en-GB/child/dolly.m4a'),
  'car': require('../../assets/sounds/en-GB/child/car.m4a'),
  'bird': require('../../assets/sounds/en-GB/child/bird.m4a'),
  'dog': require('../../assets/sounds/en-GB/child/dog.m4a'),
  'cat': require('../../assets/sounds/en-GB/child/cat.m4a'),
  'fish': require('../../assets/sounds/en-GB/child/fish.m4a'),
  'flower': require('../../assets/sounds/en-GB/child/flower.m4a'),
  'keys': require('../../assets/sounds/en-GB/child/keys.m4a'),
  'cup': require('../../assets/sounds/en-GB/child/cup.m4a'),
  'brush': require('../../assets/sounds/en-GB/child/brush.m4a'),
  'coat': require('../../assets/sounds/en-GB/child/coat.m4a'),
  'shoes': require('../../assets/sounds/en-GB/child/shoes.m4a'),
  'hat': require('../../assets/sounds/en-GB/child/hat.m4a'),
  'socks': require('../../assets/sounds/en-GB/child/socks.m4a'),
  'duck': require('../../assets/sounds/en-GB/child/duck.m4a'),
  'pig': require('../../assets/sounds/en-GB/child/pig.m4a'),
  'sheep': require('../../assets/sounds/en-GB/child/sheep.m4a'),
  'cow': require('../../assets/sounds/en-GB/child/cow.m4a'),
  'apple': require('../../assets/sounds/en-GB/child/apple.m4a'),
  'banana': require('../../assets/sounds/en-GB/child/banana.m4a'),
  'biscuit': require('../../assets/sounds/en-GB/child/biscuit.m4a'),
  'drink': require('../../assets/sounds/en-GB/child/drink.m4a'),
  'bed': require('../../assets/sounds/en-GB/child/bed.m4a'),
  'chair': require('../../assets/sounds/en-GB/child/chair.m4a'),
  'table': require('../../assets/sounds/en-GB/child/table.m4a'),
  'bath': require('../../assets/sounds/en-GB/child/bath.m4a'),
  'eyes': require('../../assets/sounds/en-GB/child/eyes.m4a'),
  'mouth': require('../../assets/sounds/en-GB/child/mouth.m4a'),
  'hair': require('../../assets/sounds/en-GB/child/hair.m4a'),
  'nose': require('../../assets/sounds/en-GB/child/nose.m4a'),
  'spoon': require('../../assets/sounds/en-GB/child/spoon.m4a'),
  'bag': require('../../assets/sounds/en-GB/child/bag.m4a'),
  'phone': require('../../assets/sounds/en-GB/child/phone.m4a'),
  'bricks': require('../../assets/sounds/en-GB/child/bricks.m4a'),
  'eating': require('../../assets/sounds/en-GB/child/eating.m4a'),
  'sleeping': require('../../assets/sounds/en-GB/child/sleeping.m4a'),
  'drinking': require('../../assets/sounds/en-GB/child/drinking.m4a'),
  'brushing': require('../../assets/sounds/en-GB/child/brushing.m4a'),
  'sitting': require('../../assets/sounds/en-GB/child/sitting.m4a'),
  'washing': require('../../assets/sounds/en-GB/child/washing.m4a'),
  'walking': require('../../assets/sounds/en-GB/child/walking.m4a'),
  'crying': require('../../assets/sounds/en-GB/child/crying.m4a'),
  'television': require('../../assets/sounds/en-GB/child/television.m4a'),
  'light': require('../../assets/sounds/en-GB/child/light.m4a'),
  'balloon': require('../../assets/sounds/en-GB/child/balloon.m4a'),
  'box': require('../../assets/sounds/en-GB/child/box.m4a'),
  'bubbles': require('../../assets/sounds/en-GB/child/bubbles.m4a'),
  'big': require('../../assets/sounds/en-GB/child/big.m4a'),
  'splashing': require('../../assets/sounds/en-GB/child/splashing.m4a'),
  'little': require('../../assets/sounds/en-GB/child/little.m4a'),
  'garden': require('../../assets/sounds/en-GB/child/garden.m4a'),
  'star': require('../../assets/sounds/en-GB/child/star.m4a'),
  'house': require('../../assets/sounds/en-GB/child/house.m4a'),
  'tree': require('../../assets/sounds/en-GB/child/tree.m4a'),
  'jumping': require('../../assets/sounds/en-GB/child/jumping.m4a'),
  'playing': require('../../assets/sounds/en-GB/child/playing.m4a'),
  'running': require('../../assets/sounds/en-GB/child/running.m4a'),
  'kissing': require('../../assets/sounds/en-GB/child/kissing.m4a'),
  'clapping': require('../../assets/sounds/en-GB/child/clapping.m4a'),
  'reading': require('../../assets/sounds/en-GB/child/reading.m4a'),
  'cutting': require('../../assets/sounds/en-GB/child/cutting.m4a'),
  'throwing': require('../../assets/sounds/en-GB/child/throwing.m4a'),
  'towel': require('../../assets/sounds/en-GB/child/towel.m4a'),
  'soap': require('../../assets/sounds/en-GB/child/soap.m4a'),
  'toothbrush': require('../../assets/sounds/en-GB/child/toothbrush.m4a'),
  'teeth': require('../../assets/sounds/en-GB/child/teeth.m4a'),
  'bread': require('../../assets/sounds/en-GB/child/bread.m4a'),
  'dinner': require('../../assets/sounds/en-GB/child/dinner.m4a'),
  'juice': require('../../assets/sounds/en-GB/child/juice.m4a'),
  'yogurt': require('../../assets/sounds/en-GB/child/yogurt.m4a'),
  'chicken': require('../../assets/sounds/en-GB/child/chicken.m4a'),
  'monkey': require('../../assets/sounds/en-GB/child/monkey.m4a'),
  'rabbit': require('../../assets/sounds/en-GB/child/rabbit.m4a'),
  'horse': require('../../assets/sounds/en-GB/child/horse.m4a'),
  'dress': require('../../assets/sounds/en-GB/child/dress.m4a'),
  'jumper': require('../../assets/sounds/en-GB/child/jumper.m4a'),
  'boots': require('../../assets/sounds/en-GB/child/boots.m4a'),
  'trousers': require('../../assets/sounds/en-GB/child/trousers.m4a'),
  'foot': require('../../assets/sounds/en-GB/child/foot.m4a'),
  'tummy': require('../../assets/sounds/en-GB/child/tummy.m4a'),
  'hand': require('../../assets/sounds/en-GB/child/hand.m4a'),
  'ear': require('../../assets/sounds/en-GB/child/ear.m4a'),
  'up': require('../../assets/sounds/en-GB/child/up.m4a'),
  'down': require('../../assets/sounds/en-GB/child/down.m4a'),
  'swing': require('../../assets/sounds/en-GB/child/swing.m4a'),
  'bike': require('../../assets/sounds/en-GB/child/bike.m4a'),
  'boat': require('../../assets/sounds/en-GB/child/boat.m4a'),
  'bus': require('../../assets/sounds/en-GB/child/bus.m4a'),
  'aeroplane': require('../../assets/sounds/en-GB/child/aeroplane.m4a'),
  'train': require('../../assets/sounds/en-GB/child/train.m4a'),
  'wet': require('../../assets/sounds/en-GB/child/wet.m4a'),
  'dirty': require('../../assets/sounds/en-GB/child/dirty.m4a'),
  'hot': require('../../assets/sounds/en-GB/child/hot.m4a'),
  'cold': require('../../assets/sounds/en-GB/child/cold.m4a'),
};

// Reward sound for successful matches
export const REWARD_SOUND = require('../../assets/sounds/_Reward_.m4a');

// Sound instance tracking to prevent multiple instances
let currentSoundInstance: InstanceType<typeof AudioModule.AudioPlayer> | null = null;

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
    try {
      currentSoundInstance.pause();
      currentSoundInstance.remove();
    } catch (error) {
      console.warn('Error stopping sound:', error);
    } finally {
      currentSoundInstance = null;
    }
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
 */
export const playWordSound = async (wordKey: string) => {
  try {
    // Stop any currently playing sound
    await stopCurrentSound();
    await stopCurrentSpeech();
    await setIsAudioActiveAsync(true);

    const soundSource = WORD_SOUNDS[wordKey];
    if (!soundSource) {
      console.warn(`No sound found for word: ${wordKey}`);
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
        try { player.remove(); } catch {}
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

  // Local custom file (not an image)
  if (wordKey.startsWith('file://') && !wordKey.match(/\.(png|jpg|jpeg|gif|bmp|webp)$/i)) {
    try {
      await stopCurrentSound();
      await stopCurrentSpeech();
      await setIsAudioActiveAsync(true);

      const player = createAudioPlayer({ uri: wordKey }, { keepAudioSessionActive: true });
      currentSoundInstance = player;
      const finishedPromise = new Promise<void>((resolve) => {
        const sub = player.addListener('playbackStatusUpdate', (status: any) => {
          if (status?.isLoaded && status?.didJustFinish) {
            try { player.remove(); } catch {}
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
  if (WORD_SOUNDS[wordKey]) {
    try {
      await stopCurrentSound();
      await stopCurrentSpeech();
      await setIsAudioActiveAsync(true);
      const player = createAudioPlayer(WORD_SOUNDS[wordKey], { keepAudioSessionActive: true });
      currentSoundInstance = player;
      const finishedPromise = new Promise<void>((resolve) => {
        const sub = player.addListener('playbackStatusUpdate', (status: any) => {
          if (status?.isLoaded && status?.didJustFinish) {
            try { player.remove(); } catch {}
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

  // Check if it's a custom sound file (file:// URI) and not an image
  if (wordKey.startsWith('file://') && !wordKey.match(/\.(png|jpg|jpeg|gif|bmp|webp)$/i)) {
    try {
      await stopCurrentSound();
      await stopCurrentSpeech();
      await setIsAudioActiveAsync(true);
      
      const player = createAudioPlayer({ uri: wordKey }, { keepAudioSessionActive: true });
      currentSoundInstance = player;
      let attemptedRestart = false;
      player.play();
      const sub = player.addListener('playbackStatusUpdate', (status: any) => {
        if (status?.isLoaded && !status?.playing && status?.currentTime === 0 && !attemptedRestart) {
          attemptedRestart = true;
          try { player.play(); } catch {}
        }
        if (status?.isLoaded && status?.didJustFinish) {
          try { player.remove(); } catch {}
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
  const hasRecording = Boolean(WORD_SOUNDS[wordKey]);
  if (hasRecording) {
    await playWordSound(wordKey);
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
    const player = createAudioPlayer(REWARD_SOUND);
    currentSoundInstance = player;
    player.play();
    await new Promise<void>((resolve) => {
      const sub = player.addListener('playbackStatusUpdate', (status: any) => {
        if (status?.isLoaded && status?.didJustFinish) {
          try { player.remove(); } catch {}
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
