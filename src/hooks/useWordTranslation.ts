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
    
    const matchesDefaultTranslation = hasDefaultTranslation && newText === defaultTranslation;
    const matchesOriginalText = newText === wordItem?.text;

    if (matchesDefaultTranslation) {
      // Matches bundled translation, so no override needed.
      delete existingTranslations[currentLocale];
    } else if (!hasDefaultTranslation && matchesOriginalText) {
      // No bundled translation and matches original text, so remove redundant override.
      delete existingTranslations[currentLocale];
    } else {
      // Persist override even if it matches the original text to allow reverting translations.
      existingTranslations[currentLocale] = newText;
    }
    
    // Return undefined if no translations left, otherwise return the object
    return Object.keys(existingTranslations).length > 0 ? existingTranslations : undefined;
  };

  return { getTranslatedWord, updateWordTranslation, currentLocale: i18n.language };
};
