import { Text, TextProps } from 'react-native';

type FontWeight = 'normal' | 'medium' | 'semibold' | 'bold' | 'heavy' | 'black';

// Jost font family mapping
const jostFontFamilyMap: Record<FontWeight, string> = {
  normal: 'Jost-Regular',
  medium: 'Jost-Medium',
  semibold: 'Jost-SemiBold',
  bold: 'Jost-Bold',
  heavy: 'Jost-ExtraBold', // Extra bold for heavy
  black: 'Jost-Black',
};

// SF Pro font family mapping
const sfProFontFamilyMap: Record<FontWeight, string> = {
  normal: 'SF-Pro-Display-Regular',
  medium: 'SF-Pro-Display-Medium',
  semibold: 'SF-Pro-Display-Semibold',
  bold: 'SF-Pro-Display-Bold',
  heavy: 'SF-Pro-Display-Heavy',
  black: 'SF-Pro-Display-Black',
};

// Legacy font family map (Jost için backward compatibility)
const fontFamilyMap = jostFontFamilyMap;

// Helper functions to get font family based on weight
export const getJostFontFamily = (weight: FontWeight = 'normal') => jostFontFamilyMap[weight];
export const getSFProFontFamily = (weight: FontWeight = 'normal') => sfProFontFamilyMap[weight];

// Legacy helper function (Jost için backward compatibility)
export const getFontFamily = (weight: FontWeight = 'normal') => getJostFontFamily(weight);

// Base Text component that always uses Jost
export function BaseText(props: TextProps) {
  return (
    <Text
      {...props}
      style={[
        { fontFamily: fontFamilyMap.normal },
        props.style,
      ]}
    />
  );
}

// Jost Text component with weight prop
export function JostText({ style, weight = 'normal', ...props }: TextProps & { weight?: FontWeight }) {
  return (
    <BaseText
      {...props}
      style={[
        { fontFamily: getJostFontFamily(weight) },
        style,
      ]}
    />
  );
}

// Legacy alias for backward compatibility
export const ThemedText = JostText;

// SF Pro Base Text component
export function SFProBaseText(props: TextProps) {
  return (
    <Text
      {...props}
      style={[
        { fontFamily: sfProFontFamilyMap.normal },
        props.style,
      ]}
    />
  );
}

// SF Pro Themed Text component with weight prop
export function SFProText({ style, weight = 'normal', ...props }: TextProps & { weight?: FontWeight }) {
  return (
    <SFProBaseText
      {...props}
      style={[
        { fontFamily: getSFProFontFamily(weight) },
        style,
      ]}
    />
  );
}
