import React, { useEffect, useRef, useState } from 'react';
import { Platform, TextInput } from 'react-native';

interface SwitchInputProps {
  onSwitchPress: (key: string) => void;
  enabled: boolean;
  style?: any;
}

export const SwitchInput: React.FC<SwitchInputProps> = ({ 
  onSwitchPress, 
  enabled, 
  style 
}) => {
  const textInputRef = useRef<TextInput>(null);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (enabled && textInputRef.current) {
      // Focus the input when enabled
      textInputRef.current.focus();
    }
  }, [enabled]);

  const handleTextChange = (text: string) => {
    if (!enabled) return;

    // Process each character in the input
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      
      // Handle different switch inputs
      switch (char) {
        case ' ': // Space key
          onSwitchPress('space');
          break;
        case '\n': // Enter key
          onSwitchPress('enter');
          break;
        case '~': // Tilde key (for ~1, ~3)
          // Look ahead for number
          if (i + 1 < text.length) {
            const nextChar = text[i + 1];
            if (nextChar === '1') {
              onSwitchPress('switch1');
              i++; // Skip the next character
            } else if (nextChar === '3') {
              onSwitchPress('switch3');
              i++; // Skip the next character
            }
          }
          break;
        case '1':
          // Check if preceded by ~
          if (i > 0 && text[i - 1] === '~') {
            onSwitchPress('switch1');
          } else {
            onSwitchPress('switch1');
          }
          break;
        case '3':
          // Check if preceded by ~
          if (i > 0 && text[i - 1] === '~') {
            onSwitchPress('switch3');
          } else {
            onSwitchPress('switch3');
          }
          break;
        case '+':
          onSwitchPress('plus');
          break;
        default:
          // Handle other characters as generic switch presses
          if (char.length === 1) {
            onSwitchPress('generic');
          }
          break;
      }
    }

    // Clear the input after processing
    if (textInputRef.current) {
      textInputRef.current.clear();
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Refocus if still enabled
    if (enabled && textInputRef.current) {
      setTimeout(() => {
        textInputRef.current?.focus();
      }, 100);
    }
  };

  if (!enabled) {
    return null;
  }

  return (
    <TextInput
      ref={textInputRef}
      style={[
        {
          position: 'absolute',
          top: -1000, // Hide off-screen
          left: -1000,
          width: 1,
          height: 1,
          opacity: 0,
        },
        style,
      ]}
      value=""
      onChangeText={handleTextChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      autoFocus={enabled}
      blurOnSubmit={false}
      multiline={false}
      keyboardType="default"
      returnKeyType="done"
      // Make it invisible but still capture input
      caretHidden={true}
      showSoftInputOnFocus={false}
      // iOS specific props
      {...(Platform.OS === 'ios' && {
        textContentType: 'none',
        autoCorrect: false,
        autoCapitalize: 'none',
        spellCheck: false,
      })}
    />
  );
};

export default SwitchInput;
