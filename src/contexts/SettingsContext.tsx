import React, { createContext, ReactNode, useContext, useState } from 'react';

interface SettingsContextType {
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
  const [cardsPerPage, setCardsPerPage] = useState(4);
  const [animationSpeed, setAnimationSpeed] = useState(0.5);
  const [settings, setSettings] = useState({
    automatic: true,
    playBeforeMatch: true,
    playAfterMatch: false,
    recordNewSounds: false,
    textToSpeech: true,
    capitalLetters: true,
    largeText: false,
    enableEditing: false,
    enableReward: false,
    enableDebugging: true,
  });

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const value = {
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
