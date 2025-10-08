import { Text, TextProps, Platform } from 'react-native';

type FontWeight = 'regular' | 'normal' | 'medium' | 'semibold' | 'bold' | 'heavy' | 'black';

// Jost font family mapping
const jostFontFamilyMap: Record<FontWeight, string> = {
  regular: 'Jost-Regular',
  normal: 'Jost-Regular', // Alias for regular
  medium: 'Jost-Medium',
  semibold: 'Jost-SemiBold',
  bold: 'Jost-Bold',
  heavy: 'Jost-ExtraBold', // Extra bold for heavy
  black: 'Jost-Black',
};

// SF Pro font family mapping
const sfProFontFamilyMap: Record<FontWeight, string> = {
  regular: 'SF-Pro-Display-Regular',
  normal: 'SF-Pro-Display-Regular', // Alias for regular
  medium: 'SF-Pro-Display-Medium',
  semibold: 'SF-Pro-Display-Semibold',
  bold: 'SF-Pro-Display-Bold',
  heavy: 'SF-Pro-Display-Heavy',
  black: 'SF-Pro-Display-Black',
};

// Legacy font family map (for Jost backward compatibility)
const fontFamilyMap = jostFontFamilyMap;

const androidFontDefaultPaddingFix = Platform.OS === 'android' ? {
  includeFontPadding: false
} : {};

// Helper functions to get font family based on weight
export const getJostFontFamily = (weight: FontWeight = 'regular') => jostFontFamilyMap[weight];
export const getSFProFontFamily = (weight: FontWeight = 'regular') => sfProFontFamilyMap[weight];

// Legacy helper function (for Jost backward compatibility)
export const getFontFamily = (weight: FontWeight = 'regular') => getJostFontFamily(weight);

// Base Text component that always uses Jost
export function BaseText(props: TextProps) {
  return (
    <Text
      {...props}
      style={[
        { fontFamily: fontFamilyMap.regular },
        androidFontDefaultPaddingFix,
        props.style,
      ]}
    />
  );
}

// Jost Text component with weight prop
export function JostText({ style, weight = 'regular', ...props }: TextProps & { weight?: FontWeight }) {
  return (
    <BaseText
      {...props}
      style={[
        { fontFamily: getJostFontFamily(weight) },
        androidFontDefaultPaddingFix,
        style,
      ]}
    />
  );
}

// SF Pro Base Text component
export function SFProBaseText(props: TextProps) {
  return (
    <Text
      {...props}
      style={[
        { fontFamily: sfProFontFamilyMap.regular },
        androidFontDefaultPaddingFix,
        props.style,
      ]}
    />
  );
}

// SF Pro Themed Text component with weight prop
export function SFProText({ style, weight = 'regular', ...props }: TextProps & { weight?: FontWeight }) {
  return (
    <SFProBaseText
      {...props}
      style={[
        { fontFamily: getSFProFontFamily(weight) },
        androidFontDefaultPaddingFix,
        style,
      ]}
    />
  );
}
