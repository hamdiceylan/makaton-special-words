import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function MatchWordsScreen() {
  return (
    <View style={styles.container}>
      {/* Üst View */}
      <View style={styles.top}>
        <View style={styles.square} />
      </View>

      {/* Alt View */}
      <View style={styles.bottom}>
        <Text style={styles.bottomText}>Toolbar / Controls</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, // VStack gibi, tüm ekran
  },
  top: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'blue', // mavi
  },
  square: {
    width: 120,
    height: 120,
    backgroundColor: 'white', // kare
  },
  bottom: {
    height: 90,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'red', // kırmızı
  },
  bottomText: {
    color: '#fff',
    fontWeight: '600',
  },
});