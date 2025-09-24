import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function MatchWordsScreen() {
  return (
    <View style={styles.container}>
      {/* Top View */}
      <View style={styles.top}>
        <View style={styles.square} />
      </View>

      {/* Bottom View */}
      <View style={styles.bottom}>
        <Text style={styles.bottomText}>Toolbar / Controls</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, // Like VStack, full screen
  },
  top: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'blue', // blue
  },
  square: {
    width: 120,
    height: 120,
    backgroundColor: 'white', // square
  },
  bottom: {
    height: 90,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'red', // red
  },
  bottomText: {
    color: '#fff',
    fontWeight: '600',
  },
});