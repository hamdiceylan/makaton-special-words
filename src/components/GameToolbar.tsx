import React from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface GameToolbarProps {
  // Navigation state
  isAtStart: boolean;
  isAtEnd: boolean;
  isLocked: boolean;
  
  // Handlers
  onToStart: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onToEnd: () => void;
  onLockPress: () => void;
  onLockLongPress: () => void;
  onRefresh: () => void;
  
  // Styling
  toolbarHeight: number;
  insetsBottom: number;
}

export default function GameToolbar({
  isAtStart,
  isAtEnd,
  isLocked,
  onToStart,
  onPrevious,
  onNext,
  onToEnd,
  onLockPress,
  onLockLongPress,
  onRefresh,
  toolbarHeight,
  insetsBottom,
}: GameToolbarProps) {
  return (
    <View style={[styles.bottomBar, { height: toolbarHeight + insetsBottom }]}>
      <SafeAreaView style={{ flex: 1 }} edges={['bottom', 'left', 'right']}>
        <View style={styles.toolbarContainer}>
          <View style={styles.toolbar}>
            {/* Left group: to-start-icon and previous-icon */}
            <View style={styles.toolbarGroup}>
              <TouchableOpacity
                style={[styles.toolbarButton, (isAtStart || isLocked) && styles.toolbarButtonDisabled]}
                onPress={(isAtStart || isLocked) ? undefined : onToStart}
                disabled={isAtStart || isLocked}
              >
                <Image
                  source={require('../../assets/images/to-start-icon.png')}
                  style={[styles.toolbarIcon, (isAtStart || isLocked) && styles.toolbarIconDisabled]}
                  resizeMode="contain"
                />
              </TouchableOpacity>
              <View style={{ width: 15 }} />
              <TouchableOpacity
                style={[styles.toolbarButton, isAtStart && styles.toolbarButtonDisabled]}
                onPress={isAtStart ? undefined : onPrevious}
                disabled={isAtStart}
              >
                <Image
                  source={require('../../assets/images/previous-icon.png')}
                  style={[styles.toolbarIcon, isAtStart && styles.toolbarIconDisabled]}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            </View>

            {/* Middle group: lock-icon and refresh-icon */}
            <View style={styles.toolbarGroup}>
              <TouchableOpacity
                style={styles.toolbarButton}
                onPress={onLockPress}
                onLongPress={onLockLongPress}
                delayLongPress={3000}
              >
                <Image
                  source={isLocked ? require('../../assets/images/unlock.png') : require('../../assets/images/lock-icon.png')}
                  style={styles.toolbarIcon}
                  resizeMode="contain"
                />
              </TouchableOpacity>
              <View style={{ width: 16 }} />
              <TouchableOpacity style={styles.toolbarButton} onPress={onRefresh}>
                <Image
                  source={require('../../assets/images/refresh-icon.png')}
                  style={styles.toolbarIcon}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            </View>

            {/* Right group: next-icon and to-end-icon */}
            <View style={styles.toolbarGroup}>
              <TouchableOpacity
                style={[styles.toolbarButton, isAtEnd && styles.toolbarButtonDisabled]}
                onPress={isAtEnd ? undefined : onNext}
                disabled={isAtEnd}
              >
                <Image
                  source={require('../../assets/images/next-icon.png')}
                  style={[styles.toolbarIcon, isAtEnd && styles.toolbarIconDisabled]}
                  resizeMode="contain"
                />
              </TouchableOpacity>
              <View style={{ width: 15 }} />
              <TouchableOpacity
                style={[styles.toolbarButton, (isAtEnd || isLocked) && styles.toolbarButtonDisabled]}
                onPress={(isAtEnd || isLocked) ? undefined : onToEnd}
                disabled={isAtEnd || isLocked}
              >
                <Image
                  source={require('../../assets/images/to-end-icon.png')}
                  style={[styles.toolbarIcon, (isAtEnd || isLocked) && styles.toolbarIconDisabled]}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  // Bottom responsive toolbar
  bottomBar: { 
    backgroundColor: '#F3F3F3' 
  },
  toolbarContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 21,
  },

  toolbarGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  toolbarButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  toolbarIcon: {
    // Let the image determine its own size
  },

  toolbarButtonDisabled: {
    // No additional styling needed for button
  },

  toolbarIconDisabled: {
    opacity: 0.4,
  },
});
