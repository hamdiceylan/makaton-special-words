import { useNavigation } from '@react-navigation/native';
import React, { useEffect } from 'react';
import { Alert, FlatList, Image, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WORD_IMAGES, words } from '../src/constants/words';
import { SFProText } from '../src/theme/typography';
import { isTablet } from '../src/utils/device';

interface WordItemProps {
  item: { image: string; text: string };
  index: number;
}

const WordItem: React.FC<WordItemProps> = ({ item, index }) => {
  const tablet = isTablet();
  const cellHeight = tablet ? 60 : 50;
  
  return (
    <View style={[styles.wordItem, { height: cellHeight }, styles.shadowCard]}>
      <Image
        source={WORD_IMAGES[item.image] || WORD_IMAGES['ball']} // Fallback to ball image
        style={styles.wordImage}
        resizeMode="contain"
      />
      <SFProText weight="semibold" style={styles.wordText}>
        {item.text}
      </SFProText>
      <View style={styles.infoButton}>
        <Image
          source={require('../assets/images/info-icon.png')}
          style={styles.infoIcon}
          resizeMode="contain"
        />
      </View>
    </View>
  );
};

export default function WordListScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  // Header button fonksiyonları
  const handleAddWord = () => {
    Alert.alert('Add Word', 'Yeni kelime ekleme fonksiyonu');
  };

  const handleEditMode = () => {
    Alert.alert('Edit Mode', 'Düzenleme modu fonksiyonu');
  };

  const handleSettings = () => {
    Alert.alert('Settings', 'Liste ayarları fonksiyonu');
  };

  // Navigation options'a fonksiyonları ekle
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: isTablet() ? 30 : 20}}>
          <Pressable 
            onPress={handleAddWord}
            style={({ pressed }) => ({
              opacity: pressed ? 0.5 : 1,
            })}
          >
            <Image 
              source={require('../assets/images/plus-icon.png')}
              style={{ width: 20, height: 20 }}
            />
          </Pressable>
          <Pressable 
            onPress={handleEditMode}
            style={({ pressed }) => ({
              opacity: pressed ? 0.5 : 1,
            })}
          >
            <Image 
              source={require('../assets/images/edit-icon.png')}
              style={{ width: 20, height: 20 }}
            />
          </Pressable>
          <Pressable 
            onPress={handleSettings}
            style={({ pressed }) => ({
              opacity: pressed ? 0.5 : 1,
            })}
          >
            <Image 
              source={require('../assets/images/list-settings-icon.png')}
              style={{ width: 20, height: 20 }}
            />
          </Pressable>
        </View>
      ),
    });
  }, [navigation]);
  
  return (
    <View style={styles.container}>
      <FlatList
        data={words}
        renderItem={({ item, index }) => <WordItem item={item} index={index} />}
        keyExtractor={(item, index) => `${item.text}-${index}`}
        contentContainerStyle={[
          styles.listContainer,
          { paddingBottom: insets.bottom + 20 } // Add bottom safe area padding plus extra space
        ]}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  listContainer: {
    paddingHorizontal: 17,
    paddingTop: 21,
  },
  wordItem: {
    backgroundColor: '#ffffff',
    borderRadius: 15,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 0,
    paddingRight: 16,
    justifyContent: 'flex-start',
  },
  shadowCard: {
    shadowColor: '#3629B7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 30,
    elevation: 4,
  },
  wordImage: {
    borderRadius: 15,
    width: 61,
    height: 47,
  },
  wordText: {
    flex: 1,
    fontSize: 18,
    color: '#000000',
    paddingLeft: 10,
    textAlignVertical: 'center',
  },
  infoButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoIcon: {
    width: 20,
    height: 20,
  },
});
