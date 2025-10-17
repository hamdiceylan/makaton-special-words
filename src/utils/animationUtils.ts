import { Animated } from 'react-native';
import { isAndroidBelow28 } from './device';

/**
 * Shared animation utilities for Android < 28 optimizations
 * Provides 2D fallbacks for 3D animations that cause issues on older Android versions
 */

// Check if we should use 2D animations for Android < 28
export const use2DAnimations = () => isAndroidBelow28();

/**
 * Creates flip animation interpolations
 * Returns different interpolations based on Android version and flip type
 * @param flipAnimation The animated value for the flip
 * @param flipType Type of flip: 'single' (0→1) or 'double' (0→2)
 */
export const createFlipAnimations = (flipAnimation: Animated.Value, flipType: 'single' | 'double' = 'single') => {
  const use2D = use2DAnimations();
  
  if (use2D) {
    // 2D flip for Android < 28 using scaleX only
    if (flipType === 'single') {
      // Single flip: 0 → 1
      return {
        frontScaleX: flipAnimation.interpolate({ 
          inputRange: [0, 0.5, 1], 
          outputRange: [1, 0, 0] 
        }),
        backScaleX: flipAnimation.interpolate({ 
          inputRange: [0, 0.5, 1], 
          outputRange: [0, 0, 1] 
        }),
        frontRotateY: undefined,
        backRotateY: undefined,
        use2D: true
      };
    } else {
      // Double flip: 0 → 2
      return {
        frontScaleX: flipAnimation.interpolate({ 
          inputRange: [0, 0.5, 1.0, 1.5, 2.0], 
          outputRange: [1, 0, 0, 0, 1] 
        }),
        backScaleX: flipAnimation.interpolate({ 
          inputRange: [0, 0.5, 1.0, 1.5, 2.0], 
          outputRange: [0, 0, 1, 0, 0] 
        }),
        frontRotateY: undefined,
        backRotateY: undefined,
        use2D: true
      };
    }
  } else {
    // 3D flip for iOS and Android >= 28
    if (flipType === 'single') {
      // Single flip: 0 → 1 (0° → 180° front, 180° → 360° back)
      return {
        frontScaleX: undefined,
        backScaleX: undefined,
        frontRotateY: flipAnimation.interpolate({ 
          inputRange: [0, 1], 
          outputRange: ['0deg', '180deg'] 
        }),
        backRotateY: flipAnimation.interpolate({ 
          inputRange: [0, 1], 
          outputRange: ['180deg', '360deg'] 
        }),
        use2D: false
      };
    } else {
      // Double flip: 0 → 2 (0° → 360° front, 180° → 540° back)
      return {
        frontScaleX: undefined,
        backScaleX: undefined,
        frontRotateY: flipAnimation.interpolate({ 
          inputRange: [0, 2], 
          outputRange: ['0deg', '360deg'] 
        }),
        backRotateY: flipAnimation.interpolate({ 
          inputRange: [0, 2], 
          outputRange: ['180deg', '540deg'] 
        }),
        use2D: false
      };
    }
  }
};

/**
 * Creates shake animation
 * Returns different shake logic based on Android version
 */
export const createShakeAnimation = (shakeValue: Animated.Value, idx: number, speed = 1) => {
  const use2D = use2DAnimations();
  
  if (use2D) {
    // 2D shake for Android < 28 using translateX
    const sign = (idx === 0 || idx === 3) ? +1 : -1;
    const shakeDistance = 8; // pixels
    shakeValue.setValue(0);
    Animated.timing(shakeValue, { toValue: -shakeDistance * sign, duration: 500 * speed, useNativeDriver: false })
      .start(f1 => {
        if (!f1) return;
        Animated.timing(shakeValue, { toValue: shakeDistance * sign, duration: 1000 * speed, useNativeDriver: false })
          .start(f2 => {
            if (!f2) return;
            Animated.timing(shakeValue, { toValue: 0, duration: 500 * speed, useNativeDriver: false }).start();
          });
      });
  } else {
    // 3D shake for iOS and Android >= 28 using rotate
    const sign = (idx === 0 || idx === 3) ? +1 : -1;
    shakeValue.setValue(0);
    Animated.timing(shakeValue, { toValue: -Math.PI / 8 * sign, duration: 500 * speed, useNativeDriver: true })
      .start(f1 => {
        if (!f1) return;
        Animated.timing(shakeValue, { toValue: Math.PI / 8 * sign, duration: 1000 * speed, useNativeDriver: true })
          .start(f2 => {
            if (!f2) return;
            Animated.timing(shakeValue, { toValue: 0, duration: 500 * speed, useNativeDriver: true }).start();
          });
      });
  }
};

/**
 * Creates shake transform for rendering
 * Returns appropriate transform based on Android version
 */
export const createShakeTransform = (shakeValue: Animated.Value) => {
  const use2D = use2DAnimations();
  
  if (!shakeValue) return undefined;
  
  if (use2D) {
    return {
      transform: [{
        translateX: shakeValue
      }]
    };
  } else {
    return {
      transform: [{
        rotate: shakeValue.interpolate({ inputRange: [-Math.PI, Math.PI], outputRange: ['-180deg', '180deg'] })
      }]
    };
  }
};

/**
 * Card side styles for different Android versions
 */
export const getCardSideStyles = (baseStyles: any) => {
  const use2D = use2DAnimations();
  
  if (use2D) {
    return {
      ...baseStyles,
      backfaceVisibility: 'visible', // 2D version - no backfaceVisibility for Android < 28
    };
  } else {
    return {
      ...baseStyles,
      backfaceVisibility: 'hidden', // 3D version - original behavior
    };
  }
};
