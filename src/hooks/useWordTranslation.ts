import { useTranslation } from 'react-i18next';

/**
 * Custom hook to get translated text for a word
 * Priority: 
 * 1. User custom translation (translations[locale])
 * 2. Default i18n translation (words.{key})
 * 3. Original text (text field)
 */
export const useWordTranslation = () => {
  const { t, i18n } = useTranslation();

  const getTranslatedWord = (wordItem: any, locale?: string): string => {
    const currentLocale = locale || i18n.language;
    
    // 1. Check user-defined translation for current locale
    if (wordItem?.translations?.[currentLocale]) {
      return wordItem.translations[currentLocale];
    }
    
    // 2. Try default translation from i18n
    const translationKey = `words.${wordItem?.text || ''}`;
    const translated = t(translationKey);
    if (translated !== translationKey) {
      return translated;
    }
    
    // 3. Fallback to original text
    return wordItem?.text || '';
  };

  /**
   * Updates the translations object for a word based on new text
   * Returns updated translations object (or undefined if empty)
   */
  const updateWordTranslation = (wordItem: any, newText: string, locale?: string): { [locale: string]: string } | undefined => {
    const currentLocale = locale || i18n.language;
    const existingTranslations: { [locale: string]: string } = wordItem?.translations ? { ...wordItem.translations } : {};
    
    // Get the default translation for this word
    const translationKey = `words.${wordItem?.text || ''}`;
    const defaultTranslation = t(translationKey);
    const hasDefaultTranslation = defaultTranslation !== translationKey;
    
    // If new text matches the default translation, remove custom translation
    if (hasDefaultTranslation && newText === defaultTranslation) {
      delete existingTranslations[currentLocale];
    }
    // If new text is different from original, save as custom translation
    else if (newText !== wordItem?.text) {
      existingTranslations[currentLocale] = newText;
    }
    // If new text matches original and there's no default translation, remove custom
    else {
      delete existingTranslations[currentLocale];
    }
    
    // Return undefined if no translations left, otherwise return the object
    return Object.keys(existingTranslations).length > 0 ? existingTranslations : undefined;
  };

  return { getTranslatedWord, updateWordTranslation, currentLocale: i18n.language };
};

