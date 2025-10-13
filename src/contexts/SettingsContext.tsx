import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { words as originalWords } from '../constants/words';

interface WordItem {
  image: string;
  text: string;
  sound?: string | null;
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
    enableParentLock: boolean;
    enableDebugging: boolean;
  };
  toggleSetting: (key: keyof SettingsContextType['settings']) => void;
  // Word list management
  wordList: WordItem[];
  setWordList: (words: WordItem[]) => void;
  resetWordList: () => void;
  isWordListEdited: boolean;
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

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  // Profiles: default to "profile1"; can be expanded with real profiles later
  const [profileId, setProfileId] = useState('profile1');

  // Per-profile, persisted fields
  const [locale, setLocale] = useState('en-GB');
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
    enableParentLock: false,
    enableDebugging: false,
  });

  // Word list management
  const [wordList, setWordListState] = useState<WordItem[]>(originalWords);
  const [isWordListEdited, setIsWordListEdited] = useState(false);

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Word list functions
  const setWordList = (words: WordItem[]) => {
    setWordListState(words);
    setIsWordListEdited(true);
  };

  const resetWordList = () => {
    setWordListState(originalWords);
    setIsWordListEdited(false);
  };

  // Namespaced storage keys per profile
  const storageKeys = useMemo(() => ({
    locale: `settings:${profileId}:locale`,
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
        const [storedLocale, storedAnimationSpeed, storedCardsPerPage, storedShuffleMode, storedSwitchCount, storedFlags, storedWordList, storedIsWordListEdited] = await Promise.all([
          AsyncStorage.getItem(storageKeys.locale),
          AsyncStorage.getItem(storageKeys.animationSpeed),
          AsyncStorage.getItem(storageKeys.cardsPerPage),
          AsyncStorage.getItem(storageKeys.shuffleMode),
          AsyncStorage.getItem(storageKeys.switchCount),
          AsyncStorage.getItem(storageKeys.flags),
          AsyncStorage.getItem(storageKeys.wordList),
          AsyncStorage.getItem(storageKeys.isWordListEdited),
        ]);
        if (!cancelled) {
          if (storedLocale) setLocale(storedLocale);
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
              setWordListState(parsedWordList);
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

  // Persist locale when it changes for the active profile
  useEffect(() => {
    (async () => {
      try {
        await AsyncStorage.setItem(storageKeys.locale, locale);
      } catch (error) {
        // ignore
      }
    })();
  }, [locale, storageKeys]);

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
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};
