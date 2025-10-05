import { useNavigation } from '@react-navigation/native';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Image, Keyboard, Platform, Pressable, StyleSheet, TextInput, TouchableWithoutFeedback, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WORD_IMAGES } from '../src/constants/words';
import { useSettings } from '../src/contexts/SettingsContext';
import { SFProText, getSFProFontFamily } from '../src/theme/typography';
import { isTablet } from '../src/utils/device';

export default function WordEditorScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { mode, index, text, image } = useLocalSearchParams<{ mode?: string; index?: string; text?: string; image?: string }>();
  const isEditMode = mode === 'edit';
  const editIndex = useMemo(() => (typeof index === 'string' ? parseInt(index, 10) : undefined), [index]);

  const { wordList, setWordList } = useSettings();

  const [wordText, setWordText] = useState<string>(isEditMode ? (text as string) ?? '' : '');
  // If adding a new word, start with no image so we can show the upload icon
  const [imageKey, setImageKey] = useState<string | null>(
    isEditMode ? ((image as string) ?? 'ball') : null
  );

  const { width, height } = useWindowDimensions();
  const onTablet = isTablet();
  const onPhoneLandscape = !onTablet && width > height;

  useEffect(() => {
    navigation.setOptions({
      title: isEditMode ? 'Edit word' : 'Add new word',
      headerLeft: () => (
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => ({
            opacity: pressed ? 0.5 : 1,
            marginLeft: Platform.OS === 'ios' && parseInt(Platform.Version as string) >= 26 ? 6 : 0,
          })}
        >
          <SFProText weight="semibold" style={{ color: '#007AFF', fontSize: 16 }}>
            Cancel
          </SFProText>
        </Pressable>
      ),
      headerRight: () => (
        <Pressable
          onPress={handleSave}
          style={({ pressed }) => ({
            opacity: pressed ? 0.5 : 1,
            marginRight: Platform.OS === 'ios' && parseInt(Platform.Version as string) >= 26 ? 6 : 0,
          })}
        >
          <SFProText weight="semibold" style={{ color: '#007AFF', fontSize: 16 }}>
            Save
          </SFProText>
        </Pressable>
      ),
    });
  }, [navigation, isEditMode, wordText]);

  const handleSave = () => {
    const trimmed = wordText.trim();
    if (!trimmed) {
      router.back();
      return;
    }

    if (isEditMode && typeof editIndex === 'number' && editIndex >= 0 && editIndex < wordList.length) {
      const updated = [...wordList];
      updated[editIndex] = { image: imageKey ?? 'ball', text: trimmed };
      setWordList(updated);
    } else {
      setWordList([...wordList, { image: imageKey ?? 'ball', text: trimmed }]);
    }

    router.back();
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={[styles.container, !onTablet && styles.containerPhone, { paddingBottom: insets.bottom + 12 }]}>
        <View style={[!onTablet && !onPhoneLandscape && styles.contentPhone]}>
          {onPhoneLandscape ? (
            <View style={styles.landscapeRow}>
              <View style={styles.landCol}>
                <View style={styles.group}>
                  <SFProText weight="semibold" style={styles.label}>Word</SFProText>
                  <TextInput
                    value={wordText}
                    onChangeText={setWordText}
                    placeholder="Type here"
                    placeholderTextColor="#757575"
                    style={[styles.input, !onTablet && styles.inputPhone, { fontFamily: getSFProFontFamily('semibold') }]}
                  />
                </View>
                <View style={styles.group}>
                  <SFProText weight="medium" style={styles.label}>Sound</SFProText>
                  <View style={[styles.row, !onTablet && styles.rowPhone]}>
                    <Pressable style={[styles.actionBtn, !onTablet && styles.actionBtnPhone]}>
                      <Image source={require('../assets/images/record-icon.png')} style={styles.actionIcon} />
                      <SFProText weight="semibold" style={styles.actionText}>Record</SFProText>
                    </Pressable>
                    <Pressable style={[styles.actionBtn, !onTablet && styles.actionBtnPhone]}>
                      <Image source={require('../assets/images/play-icon.png')} style={styles.actionIcon} />
                      <SFProText weight="semibold" style={styles.actionText}>Play</SFProText>
                    </Pressable>
                  </View>
                </View>
              </View>
              <View style={styles.landCol}>
                <View style={styles.group}>
                  <SFProText weight="semibold" style={styles.label}>Picture</SFProText>
                  <View style={[styles.imageBox, !onTablet && styles.imageBoxPhone]}>
                    {imageKey ? (
                      <Image
                        source={WORD_IMAGES[imageKey] || WORD_IMAGES['ball']}
                        style={onTablet ? { width: 90, height: 70 } : { width: 207, height: 159 }}
                        resizeMode="contain"
                      />
                    ) : (
                      <Image source={require('../assets/images/upload-icon.png')} style={{ width: 60, height: 60 }} resizeMode="contain" />
                    )}
                  </View>
                  <View style={[styles.row, !onTablet && styles.rowPhone]}>
                    <Pressable style={[styles.actionBtn, !onTablet && styles.actionBtnPhone]}>
                      <Image source={require('../assets/images/gallery-icon.png')} style={styles.actionIcon} />
                      <SFProText weight="semibold" style={styles.actionText}>Gallery</SFProText>
                    </Pressable>
                    <Pressable style={[styles.actionBtn, !onTablet && styles.actionBtnPhone]}>
                      <Image source={require('../assets/images/camera-icon.png')} style={styles.actionIcon} />
                      <SFProText weight="semibold" style={styles.actionText}>Camera</SFProText>
                    </Pressable>
                  </View>
                </View>
              </View>
            </View>
          ) : (
            <>
              <View style={styles.group}>
                <SFProText weight="semibold" style={styles.label}>Word</SFProText>
                <TextInput
                  value={wordText}
                  onChangeText={setWordText}
                  placeholder="Type here"
                  placeholderTextColor="#757575"
                  style={[styles.input, !onTablet && styles.inputPhone, { fontFamily: getSFProFontFamily('semibold') }]}
                />
              </View>

              <View style={styles.group}>
                <SFProText weight="semibold" style={styles.label}>Picture</SFProText>
                <View style={[styles.imageBox, !onTablet && styles.imageBoxPhone]}>
                  {imageKey ? (
                    <Image
                      source={WORD_IMAGES[imageKey] || WORD_IMAGES['ball']}
                      style={onTablet ? { width: 90, height: 70 } : { width: 207, height: 159 }}
                      resizeMode="contain"
                    />
                  ) : (
                    <Image source={require('../assets/images/upload-icon.png')} style={{ width: 60, height: 60 }} resizeMode="contain" />
                  )}
                </View>
                <View style={[styles.row, !onTablet && styles.rowPhone]}>
                  <Pressable style={[styles.actionBtn, !onTablet && styles.actionBtnPhone]}>
                    <Image source={require('../assets/images/gallery-icon.png')} style={styles.actionIcon} />
                    <SFProText weight="semibold" style={styles.actionText}>Gallery</SFProText>
                  </Pressable>
                  <Pressable style={[styles.actionBtn, !onTablet && styles.actionBtnPhone]}>
                    <Image source={require('../assets/images/camera-icon.png')} style={styles.actionIcon} />
                    <SFProText weight="semibold" style={styles.actionText}>Camera</SFProText>
                  </Pressable>
                </View>
              </View>

              <View style={styles.group}>
                <SFProText weight="medium" style={styles.label}>Sound</SFProText>
                <View style={[styles.row, !onTablet && styles.rowPhone]}>
                  <Pressable style={[styles.actionBtn, !onTablet && styles.actionBtnPhone]}>
                    <Image source={require('../assets/images/record-icon.png')} style={styles.actionIcon} />
                    <SFProText weight="semibold" style={styles.actionText}>Record</SFProText>
                  </Pressable>
                  <Pressable style={[styles.actionBtn, !onTablet && styles.actionBtnPhone]}>
                    <Image source={require('../assets/images/play-icon.png')} style={styles.actionIcon} />
                    <SFProText weight="semibold" style={styles.actionText}>Play</SFProText>
                  </Pressable>
                </View>
              </View>
            </>
          )}
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingHorizontal: 17,
    paddingTop: 31,
  },
  containerPhone: {
    alignItems: 'center',
  },
  contentPhone: {
    width: 207,
  },
  landscapeRow: {
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'center',
  },
  landCol: {
    width: 207,
  },
  group: {
    marginBottom: 38,
  },
  label: {
    fontSize: 18,
    color: '#000000',
    marginBottom: 8,
  },
  input: {
    height: 52,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E1E1E1',
    paddingHorizontal: 12,
    fontSize: 18,
    color: '#000000',
    backgroundColor: '#FFFFFF',
  },
  inputPhone: {
    width: 207,
    height: 52,
  },
  imageBox: {
    height: 159,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E1E1E1',
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    overflow: 'hidden',
  },
  imageBoxPhone: {
    width: 207,
    height: 159,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  rowPhone: {
    gap: 7,
  },
  actionBtn: {
    backgroundColor: '#233D91',
    borderRadius: 4,
    paddingHorizontal: 7,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  actionBtnPhone: {
    width: 100,
    height: 36,
    paddingHorizontal: 0,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 15,
  },
  actionIcon: {
    width: 20,
    height: 20,
  },
});


