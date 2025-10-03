import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';

interface SettingsContextType {
  profileId: string;
  setProfileId: (profileId: string) => void;
  locale: string;
  setLocale: (locale: string) => void;
  cardsPerPage: number;
  setCardsPerPage: (value: number) => void;
  animationSpeed: number;
  setAnimationSpeed: (value: number) => void;
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
  const [animationSpeed, internalSetAnimationSpeed] = useState(0.5);
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

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Namespaced storage keys per profile
  const storageKeys = useMemo(() => ({
    locale: `settings:${profileId}:locale`,
    animationSpeed: `settings:${profileId}:animationSpeed`,
    cardsPerPage: `settings:${profileId}:cardsPerPage`,
    flags: `settings:${profileId}:flags`,
  }), [profileId]);

  // Load persisted data when profile changes (or on mount)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [storedLocale, storedAnimationSpeed, storedCardsPerPage, storedFlags] = await Promise.all([
          AsyncStorage.getItem(storageKeys.locale),
          AsyncStorage.getItem(storageKeys.animationSpeed),
          AsyncStorage.getItem(storageKeys.cardsPerPage),
          AsyncStorage.getItem(storageKeys.flags),
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
          if (storedFlags) {
            try {
              const parsedFlags = JSON.parse(storedFlags);
              setSettings(prev => ({ ...prev, ...parsedFlags }));
            } catch {}
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

  // Persist boolean flags (settings) per profile
  useEffect(() => {
    (async () => {
      try {
        await AsyncStorage.setItem(storageKeys.flags, JSON.stringify(settings));
      } catch {}
    })();
  }, [settings, storageKeys]);

  // Wrapped setter to clamp to [0,1] and step by 0.1 increments
  const setAnimationSpeed = (value: number) => {
    const clamped = Math.max(0, Math.min(1, value));
    const stepped = Math.round(clamped * 10) / 10;
    internalSetAnimationSpeed(stepped);
  };

  const value = {
    profileId,
    setProfileId,
    locale,
    setLocale,
    cardsPerPage,
    setCardsPerPage,
    animationSpeed,
    setAnimationSpeed,
    settings,
    toggleSetting,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};
