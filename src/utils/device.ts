import { Dimensions, Platform } from 'react-native';

// Device & Orientation detection utilities
export const isTablet = () => {
  const { width, height } = Dimensions.get('window');
  const minDimension = Math.min(width, height);
  
  // iPad threshold: 744px (iPad Mini dahil), Android tablet threshold: 600px
  return Platform.OS === 'ios' ? 
    minDimension >= 744 : 
    minDimension >= 600;
};

export const isLandscape = (width: number, height: number) => width > height;

// Get current screen dimensions
export const getScreenDimensions = () => Dimensions.get('window');

// Check if current orientation is landscape
export const isCurrentlyLandscape = () => {
  const { width, height } = getScreenDimensions();
  return isLandscape(width, height);
};

// Check if current device is tablet
export const isCurrentlyTablet = () => isTablet();
