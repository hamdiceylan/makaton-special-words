import { Platform, StyleSheet, View } from 'react-native';
import { ThemedText } from '../theme/typography';

type GameCardProps = {
  title: string;
  backgroundColor: string;
  style?: any;
};

export function GameCard({ title, style }: GameCardProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.card}>
        <ThemedText weight="semibold" style={styles.title}>
          {title}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...Platform.select({
      ios: {
        shadowColor: '#3629B7',
        shadowOffset: {
          width: 0,
          height: 4,
        },
        shadowOpacity: 0.07,
        shadowRadius: 30,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  card: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 16,
    color: '#000',
  },
});
