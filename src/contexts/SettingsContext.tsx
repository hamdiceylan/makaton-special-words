import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import React, { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { words as originalWords } from '../constants/words';
import { DEFAULT_IMAGE_KEY, normalizeImageStorageKey } from '../utils/imageUtils';
import { normalizeSoundStorageKey } from '../utils/soundUtils';

interface WordItem {
  image: string;
  text: string;
  sound?: string | null;
  translations?: { [locale: string]: string };
}

function normalizeWordSoundEntry<T extends { sound?: string | null }>(item: T): T {
  if (!item) {
    return item;
  }
  const currentSound = item.sound ?? null;
  const normalized = normalizeSoundStorageKey(currentSound);
  if (normalized === currentSound) {
    return item;
  }
  return {
    ...item,
    sound: normalized ?? null,
  };
}

function normalizeWordImageEntry<T extends { image?: string | null }>(item: T): T {
  if (!item) {
    return item;
  }
  const currentImage = (item as any).image ?? null;
  const normalized = normalizeImageStorageKey(currentImage);
  if (normalized === currentImage) {
    return item;
  }
  return {
    ...item,
    image: normalized ?? DEFAULT_IMAGE_KEY,
  };
}

function normalizeWordCollection<T extends { sound?: string | null; image?: string | null }>(items: T[]): T[] {
  let changed = false;
  const normalized = items.map((item) => {
    let next = normalizeWordSoundEntry(item);
    if (next !== item) {
      changed = true;
    }
    const withImage = normalizeWordImageEntry(next);
    if (withImage !== next) {
      changed = true;
    }
    return withImage;
  });
  return changed ? normalized : items;
}

interface SettingsContextType {
  profileId: string;
  setProfileId: (profileId: string) => void;
  locale: string;
  setLocale: (locale: string) => void;
  cardsPerPage: number;
  setCardsPerPage: (value: number) => void;
  shuffleMode: 'off' | 'page' | 'all';
  setShuffleMode: (value: 'off' | 'page' | 'all') => void;
  animationSpeed: number;
  setAnimationSpeed: (value: number) => void;
  speedMultiplier: number; // derived: 2.0 * (1.1 - animationSpeed)
  switchCount: number;
  setSwitchCount: (value: number) => void;
  settings: {
    automatic: boolean;
    playBeforeMatch: boolean;
    playAfterMatch: boolean;
    recordNewSounds: boolean;
    textToSpeech: boolean;
    capitalLetters: boolean;
    largeText: boolean;
    enableEditing: boolean;
    enableReward: boolean;
    enableDebugging: boolean;
  };
  toggleSetting: (key: keyof SettingsContextType['settings']) => void;
  // Word list management
  wordList: WordItem[];
  setWordList: (words: WordItem[]) => void;
  resetWordList: () => void;
  isWordListEdited: boolean;
  shouldScrollToBottom: boolean;
  setShouldScrollToBottom: (value: boolean) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

interface SettingsProviderProps {
  children: ReactNode;
}

// Helper to map i18n language code to sound locale
const mapLanguageToSoundLocale = (languageCode: string): string => {
  switch (languageCode) {
    case 'tr':
      return 'tr';
    case 'en':
    default:
      return 'en-GB';
  }
};

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  // Profiles: default to "profile1"; can be expanded with real profiles later
  const [profileId, setProfileId] = useState('profile1');

  // Get device locale on mount
  const deviceLanguage = useMemo(() => {
    const langCode = Localization.getLocales()[0]?.languageCode || 'en';
    return mapLanguageToSoundLocale(langCode);
  }, []);

  // Per-profile, persisted fields
  const [locale, setLocale] = useState(deviceLanguage);
  const [cardsPerPage, setCardsPerPage] = useState(4);
  const [shuffleMode, setShuffleMode] = useState<'off' | 'page' | 'all'>('off');
  const [animationSpeed, internalSetAnimationSpeed] = useState(0.5);
  const [switchCount, setSwitchCount] = useState(0);
  const [settings, setSettings] = useState({
    automatic: false,
    playBeforeMatch: true,
    playAfterMatch: true,
    recordNewSounds: true,
    textToSpeech: false,
    capitalLetters: false,
    largeText: false,
    enableEditing: true,
    enableReward: true,
    enableDebugging: false,
  });

  // Word list management
  const [wordList, setWordListState] = useState<WordItem[]>(normalizeWordCollection(originalWords));
  const [isWordListEdited, setIsWordListEdited] = useState(false);
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(false);

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Word list functions
  const setWordList = (words: WordItem[]) => {
    setWordListState(normalizeWordCollection(words));
    setIsWordListEdited(true);
  };

  const resetWordList = () => {
    setWordListState(normalizeWordCollection(originalWords));
    setIsWordListEdited(false);
  };

  // Namespaced storage keys per profile
  // Note: locale is NOT persisted - always use device language
  const storageKeys = useMemo(() => ({
    animationSpeed: `settings:${profileId}:animationSpeed`,
    cardsPerPage: `settings:${profileId}:cardsPerPage`,
    shuffleMode: `settings:${profileId}:shuffleMode`,
    switchCount: `settings:${profileId}:switchCount`,
    flags: `settings:${profileId}:flags`,
    wordList: `settings:${profileId}:wordList`,
    isWordListEdited: `settings:${profileId}:isWordListEdited`,
  }), [profileId]);

  // Load persisted data when profile changes (or on mount)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [storedAnimationSpeed, storedCardsPerPage, storedShuffleMode, storedSwitchCount, storedFlags, storedWordList, storedIsWordListEdited] = await Promise.all([
          AsyncStorage.getItem(storageKeys.animationSpeed),
          AsyncStorage.getItem(storageKeys.cardsPerPage),
          AsyncStorage.getItem(storageKeys.shuffleMode),
          AsyncStorage.getItem(storageKeys.switchCount),
          AsyncStorage.getItem(storageKeys.flags),
          AsyncStorage.getItem(storageKeys.wordList),
          AsyncStorage.getItem(storageKeys.isWordListEdited),
        ]);
        if (!cancelled) {
          // Always use device language - don't persist locale
          // This ensures the app language always matches the device language
          setLocale(deviceLanguage);
          if (storedAnimationSpeed) {
            const parsed = parseFloat(storedAnimationSpeed);
            if (!Number.isNaN(parsed)) {
              const clamped = Math.max(0, Math.min(1, parsed));
              const stepped = Math.round(clamped * 10) / 10;
              internalSetAnimationSpeed(stepped);
            }
          }
          if (storedCardsPerPage) {
            const parsedCards = parseInt(storedCardsPerPage, 10);
            if (!Number.isNaN(parsedCards)) {
              setCardsPerPage(parsedCards);
            }
          }
          if (storedShuffleMode === 'off' || storedShuffleMode === 'page' || storedShuffleMode === 'all') {
            setShuffleMode(storedShuffleMode);
          }
          if (storedSwitchCount) {
            const parsedSwitchCount = parseInt(storedSwitchCount, 10);
            if (!Number.isNaN(parsedSwitchCount) && parsedSwitchCount >= 0 && parsedSwitchCount <= 3) {
              setSwitchCount(parsedSwitchCount);
            }
          }
          if (storedFlags) {
            try {
              const parsedFlags = JSON.parse(storedFlags);
              setSettings(prev => ({ ...prev, ...parsedFlags }));
            } catch {}
          }
          if (storedWordList) {
            try {
              const parsedWordList = JSON.parse(storedWordList);
              if (Array.isArray(parsedWordList)) {
                setWordListState(normalizeWordCollection(parsedWordList));
              }
            } catch {}
          }
          if (storedIsWordListEdited) {
            setIsWordListEdited(storedIsWordListEdited === 'true');
          }
        }
      } catch (error) {
        // swallow errors; keep defaults
      }
    })();
    return () => { cancelled = true; };
  }, [storageKeys]);

  // Note: locale is NOT persisted - always use device language
  
  // Persist animationSpeed per profile when it changes
  useEffect(() => {
    (async () => {
      try {
        await AsyncStorage.setItem(storageKeys.animationSpeed, String(animationSpeed));
      } catch (error) {
        // ignore
      }
    })();
  }, [animationSpeed, storageKeys]);

  // Persist cardsPerPage per profile
  useEffect(() => {
    (async () => {
      try {
        await AsyncStorage.setItem(storageKeys.cardsPerPage, String(cardsPerPage));
      } catch {}
    })();
  }, [cardsPerPage, storageKeys]);

  // Persist shuffleMode per profile
  useEffect(() => {
    (async () => {
      try {
        await AsyncStorage.setItem(storageKeys.shuffleMode, shuffleMode);
      } catch {}
    })();
  }, [shuffleMode, storageKeys]);

  // Persist switchCount per profile
  useEffect(() => {
    (async () => {
      try {
        await AsyncStorage.setItem(storageKeys.switchCount, String(switchCount));
      } catch {}
    })();
  }, [switchCount, storageKeys]);

  // Persist boolean flags (settings) per profile
  useEffect(() => {
    (async () => {
      try {
        await AsyncStorage.setItem(storageKeys.flags, JSON.stringify(settings));
      } catch {}
    })();
  }, [settings, storageKeys]);

  // Persist word list per profile
  useEffect(() => {
    (async () => {
      try {
        await AsyncStorage.setItem(storageKeys.wordList, JSON.stringify(wordList));
      } catch {}
    })();
  }, [wordList, storageKeys]);

  // Persist word list edited flag per profile
  useEffect(() => {
    (async () => {
      try {
        await AsyncStorage.setItem(storageKeys.isWordListEdited, String(isWordListEdited));
      } catch {}
    })();
  }, [isWordListEdited, storageKeys]);

  // Wrapped setter to clamp to [0,1] and step by 0.1 increments
  const setAnimationSpeed = (value: number) => {
    const clamped = Math.max(0, Math.min(1, value));
    const stepped = Math.round(clamped * 10) / 10;
    internalSetAnimationSpeed(stepped);
  };

  // Derived speed multiplier used by animations across the app
  const speedMultiplier = useMemo(() => {
    // multiplier = 2.0 * (1.1 - slider)
    const raw = 2.0 * (1.1 - animationSpeed);
    // Guard rails (expected range given slider in [0,1])
    return Math.max(0.2, Math.min(2.2, Math.round(raw * 100) / 100));
  }, [animationSpeed]);

  const value = {
    profileId,
    setProfileId,
    locale,
    setLocale,
    cardsPerPage,
    setCardsPerPage,
    shuffleMode,
    setShuffleMode,
    animationSpeed,
    setAnimationSpeed,
    speedMultiplier,
    switchCount,
    setSwitchCount,
    settings,
    toggleSetting,
    wordList,
    setWordList,
    resetWordList,
    isWordListEdited,
    shouldScrollToBottom,
    setShouldScrollToBottom,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};
