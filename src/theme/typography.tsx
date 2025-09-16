import { Text, TextProps } from 'react-native';

type FontWeight = 'normal' | 'medium' | 'semibold' | 'bold';

const fontFamilyMap: Record<FontWeight, string> = {
  normal: 'Jost-Regular',
  medium: 'Jost-Medium',
  semibold: 'Jost-SemiBold',
  bold: 'Jost-Bold',
};

// Helper function to get font family based on weight
export const getFontFamily = (weight: FontWeight = 'normal') => fontFamilyMap[weight];

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

// Custom Text component with weight prop
export function ThemedText({ style, weight = 'normal', ...props }: TextProps & { weight?: FontWeight }) {
  return (
    <BaseText
      {...props}
      style={[
        { fontFamily: getFontFamily(weight) },
        style,
      ]}
    />
  );
}
