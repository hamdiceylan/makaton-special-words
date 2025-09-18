import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SFProText } from '../src/theme/typography';

export default function MatchWordsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <SFProText weight="bold" style={styles.title}>
          Match Words
        </SFProText>
        <SFProText weight="regular" style={styles.subtitle}>
          Coming Soon...
        </SFProText>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#9893CA',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 32,
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#FFFFFF',
    opacity: 0.8,
    textAlign: 'center',
  },
});
