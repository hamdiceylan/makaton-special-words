import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Image, Platform, Pressable, StyleSheet, View } from 'react-native';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WORD_IMAGES, words } from '../src/constants/words';
import { useSettings } from '../src/contexts/SettingsContext';
import { SFProText } from '../src/theme/typography';
import { isTablet } from '../src/utils/device';

interface WordItemProps {
  item: { image: string; text: string };
  index: number;
  isEditMode: boolean;
  onRemove: (index: number) => void;
  drag: () => void;
  isActive: boolean;
}

const WordItem: React.FC<WordItemProps> = React.memo(({ item, index, isEditMode, onRemove, drag, isActive }) => {
  const tablet = isTablet();
  const cellHeight = tablet ? 60 : 50;
  
  return (
    <View style={[
      styles.wordItem, 
      { height: cellHeight }, 
      styles.shadowCard,
      isActive && styles.activeItem
    ]}>
      {isEditMode && (
        <Pressable 
          style={styles.removeButton}
          onPress={() => onRemove(index)}
        >
          <View style={styles.removeButtonCircle}>
            <View style={styles.removeButtonLine} />
          </View>
        </Pressable>
      )}
      
      <Image
        source={WORD_IMAGES[item.image] || WORD_IMAGES['ball']} // Fallback to ball image
        style={styles.wordImage}
        resizeMode="contain"
      />
      <SFProText weight="semibold" style={styles.wordText}>
        {item.text}
      </SFProText>
      
      {isEditMode ? (
        <Pressable 
          style={styles.dragButton} 
          onPressIn={drag}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <View style={styles.dragLines}>
            <View style={styles.dragLine} />
            <View style={styles.dragLine} />
            <View style={styles.dragLine} />
          </View>
        </Pressable>
      ) : (
        <View style={styles.infoButton}>
          <Image
            source={require('../assets/images/info-icon.png')}
            style={styles.infoIcon}
            resizeMode="contain"
          />
        </View>
      )}
    </View>
  );
});

export default function WordListScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { settings } = useSettings();
  const [isEditMode, setIsEditMode] = useState(false);
  const [wordList, setWordList] = useState(words);

  // Header button functions
  const handleAddWord = () => {
    Alert.alert('Add Word', 'Add new word function');
  };

  const handleEditMode = () => {
    setIsEditMode(!isEditMode);
  };

  const handleSettings = () => {
    Alert.alert('Settings', 'List settings function');
  };

  const handleRemoveWord = (index: number) => {
    Alert.alert(
      'Remove Word',
      'Are you sure you want to remove this word?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => {
            const newList = wordList.filter((_, i) => i !== index);
            setWordList(newList);
          }
        }
      ]
    );
  };

  const handleReorder = ({ data }: { data: typeof words }) => {
    setWordList(data);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleDragBegin = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  // Add functions to navigation options
  useEffect(() => {
    navigation.setOptions({
      headerLeft: isEditMode ? () => (
        <Pressable 
          onPress={() => setIsEditMode(false)}
          style={({ pressed }) => ({
            opacity: pressed ? 0.5 : 1,
            marginLeft: Platform.OS === 'ios' && parseInt(Platform.Version as string) >= 26 ? 6 : 0,
          })}
        >
          <SFProText weight="semibold" style={{ color: '#007AFF', fontSize: 16 }}>
            Done
          </SFProText>
        </Pressable>
      ) : undefined,
      headerRight: () => (
        <View style={{ 
          flexDirection: 'row', 
          alignItems: 'center', 
          gap: isTablet() ? 30 : 20,
          paddingLeft: Platform.OS === 'ios' && parseInt(Platform.Version as string) >= 26 ? 6 : 0,
          paddingRight: Platform.OS === 'ios' && parseInt(Platform.Version as string) >= 26 ? 6 : 0,
        }}>
          <Pressable 
            onPress={settings.enableEditing && !isEditMode ? handleAddWord : undefined}
            disabled={!settings.enableEditing || isEditMode}
            style={({ pressed }) => ({
              opacity: (!settings.enableEditing || isEditMode) ? 0.4 : (pressed ? 0.5 : 1),
            })}
          >
            <Image 
              source={require('../assets/images/plus-icon.png')}
              style={{ width: 20, height: 20 }}
            />
          </Pressable>
          <Pressable 
            onPress={settings.enableEditing && !isEditMode ? handleEditMode : undefined}
            disabled={!settings.enableEditing || isEditMode}
            style={({ pressed }) => ({
              opacity: (!settings.enableEditing || isEditMode) ? 0.4 : (pressed ? 0.5 : 1),
            })}
          >
            <Image 
              source={require('../assets/images/edit-icon.png')}
              style={{ 
                width: 20, 
                height: 20,
                tintColor: isEditMode ? '#007AFF' : undefined
              }}
            />
          </Pressable>
          <Pressable 
            onPress={!isEditMode ? handleSettings : undefined}
            disabled={isEditMode}
            style={({ pressed }) => ({
              opacity: isEditMode ? 0.4 : (pressed ? 0.5 : 1),
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
  }, [navigation, settings.enableEditing, isEditMode]);
  
  const renderItem = React.useCallback(({ item, drag, isActive, getIndex }: RenderItemParams<{ image: string; text: string }>) => {
    const index = getIndex?.() ?? 0;
    return (
      <WordItem 
        item={item} 
        index={index} 
        isEditMode={isEditMode}
        onRemove={handleRemoveWord}
        drag={drag}
        isActive={isActive}
      />
    );
  }, [isEditMode, handleRemoveWord]);

  return (
    <View style={styles.container}>
      {isEditMode ? (
        <DraggableFlatList
          data={wordList}
          renderItem={renderItem}
          keyExtractor={(item: { image: string; text: string }, index: number) => `drag-${item.text}-${index}`}
          onDragBegin={handleDragBegin}
          onDragEnd={handleReorder}
          contentContainerStyle={[
            styles.listContainer,
            { paddingBottom: insets.bottom + 20 }
          ]}
          showsVerticalScrollIndicator={false}
          activationDistance={5}
          dragItemOverflow={false}
          animationConfig={{
            duration: 150,
          }}
          autoscrollThreshold={50}
          autoscrollSpeed={200}
        />
      ) : (
        <FlatList
          data={wordList}
          renderItem={({ item, index }) => (
            <WordItem 
              item={item} 
              index={index} 
              isEditMode={false}
              onRemove={() => {}}
              drag={() => {}}
              isActive={false}
            />
          )}
          keyExtractor={(item: { image: string; text: string }, index: number) => `${item.text}-${index}`}
          contentContainerStyle={[
            styles.listContainer,
            { paddingBottom: insets.bottom + 20 }
          ]}
          showsVerticalScrollIndicator={false}
        />
      )}
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
  activeItem: {
    opacity: 0.95,
    transform: [{ scale: 1.02 }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  removeButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  removeButtonCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonLine: {
    width: 12,
    height: 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 1,
  },
  dragButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  dragLines: {
    flexDirection: 'column',
    gap: 3,
  },
  dragLine: {
    width: 16,
    height: 2,
    backgroundColor: '#8E8E93',
    borderRadius: 1,
  },
});
