import { useColorScheme as useRNColorScheme } from 'react-native';

export function useColorScheme(): 'light' {
  // React Native'in color scheme'ini oku ama her zaman 'light' döndür
  useRNColorScheme(); // Bu sadece re-render için
  return 'light';
}