import { useNavigation } from '@react-navigation/native';
import { AudioModule, RecordingPresets, createAudioPlayer, requestRecordingPermissionsAsync, setAudioModeAsync, setIsAudioActiveAsync } from 'expo-audio';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Keyboard, Platform, Pressable, StyleSheet, TextInput, TouchableWithoutFeedback, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WORD_IMAGES } from '../src/constants/words';
import { useSettings } from '../src/contexts/SettingsContext';
import { useWordTranslation } from '../src/hooks/useWordTranslation';
import { SFProText, getSpecialLettersFontFamily } from '../src/theme/typography';
import { isTablet } from '../src/utils/device';
import { copyImageToPersistentStorage, isPersistentImageKey, normalizeImageStorageKey, resolveImageSource } from '../src/utils/imageUtils';
import { copySoundToPersistentStorage, initializeAudio, isLikelySoundUri, normalizeSoundStorageKey, normalizeSoundUri, playWord, stopCurrentSound, stopCurrentSpeech } from '../src/utils/soundUtils';

export default function WordEditorScreen() {
  const { t, i18n } = useTranslation();
  const { getTranslatedWord, updateWordTranslation, currentLocale } = useWordTranslation();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { mode, index, text, image } = useLocalSearchParams<{ mode?: string; index?: string; text?: string; image?: string }>();
  const isEditMode = mode === 'edit';
  const editIndex = useMemo(() => (typeof index === 'string' ? parseInt(index, 10) : undefined), [index]);

  const { wordList, setWordList, settings, locale, setShouldScrollToBottom } = useSettings();

  // Get initial values for edit mode
  const getInitialValues = () => {
    if (!isEditMode || typeof editIndex !== 'number' || editIndex < 0 || editIndex >= wordList.length) {
      return { displayText: '', originalText: '' };
    }
    
    const wordItem = wordList[editIndex] as any;
    const displayText = getTranslatedWord(wordItem);
    
    return {
      displayText,
      originalText: wordItem.text
    };
  };

  const initialValues = useMemo(() => getInitialValues(), [isEditMode, editIndex, wordList, currentLocale]);

  const [wordText, setWordText] = useState<string>(initialValues.displayText);
  const [originalText] = useState<string>(initialValues.originalText);
  const initialImageKey = useMemo(
    () => (isEditMode ? normalizeImageStorageKey((image as string) ?? 'ball') : null),
    [image, isEditMode]
  );
  // If adding a new word, start with no image so we can show the upload icon
  const [imageKey, setImageKey] = useState<string | null>(initialImageKey);
  const [isRecording, setIsRecording] = useState(false);
  const [recorder, setRecorder] = useState<InstanceType<typeof AudioModule.AudioRecorder> | null>(null);
  const [recordedSoundUri, setRecordedSoundUri] = useState<string | null>(null);

  const { width, height } = useWindowDimensions();
  const onTablet = isTablet();
  const onPhoneLandscape = !onTablet && width > height;

  useEffect(() => {
    initializeAudio();
  }, []);

  useEffect(() => {
    if (isEditMode) {
      setImageKey(initialImageKey);
    }
  }, [initialImageKey, isEditMode]);

  useEffect(() => {
    if (isEditMode && typeof editIndex === 'number' && editIndex >= 0 && editIndex < wordList.length) {
      const existing: any = wordList[editIndex];
      const storageSound = normalizeSoundStorageKey(typeof existing?.sound === 'string' ? existing.sound : null);
      if (storageSound && isLikelySoundUri(storageSound)) {
        setRecordedSoundUri(storageSound);
      } else {
        setRecordedSoundUri(null);
      }
    }
  }, [isEditMode, editIndex, wordList]);

  const canSave = useMemo(() => {
    const t = (wordText || '').trim();
    const hasText = t.length > 0;
    const hasImage = !!imageKey;
    const needSound = !isEditMode && !!settings?.recordNewSounds;
    const hasSound = !needSound || !!recordedSoundUri;
    return hasText && hasImage && hasSound;
  }, [wordText, imageKey, isEditMode, settings?.recordNewSounds, recordedSoundUri]);

  const pickFromGallery = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (perm.status !== 'granted') return;
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.9,
        allowsEditing: true,
      });
      if (!result.canceled && result.assets && result.assets[0]?.uri) {
        const persistentUri = await copyImageToPersistentStorage(result.assets[0].uri);
        setImageKey(normalizeImageStorageKey(persistentUri) ?? null);
      }
    } catch {}
  };

  const takePhoto = async () => {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (perm.status !== 'granted') return;
      const result = await ImagePicker.launchCameraAsync({
        quality: 0.9,
        allowsEditing: true,
      });
      if (!result.canceled && result.assets && result.assets[0]?.uri) {
        const persistentUri = await copyImageToPersistentStorage(result.assets[0].uri);
        setImageKey(normalizeImageStorageKey(persistentUri) ?? null);
      }
    } catch {}
  };

  const startRecording = async () => {
    try {
      const perm = await requestRecordingPermissionsAsync();
      if (perm.status !== 'granted') return;
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      const r = new AudioModule.AudioRecorder({ ...RecordingPresets.HIGH_QUALITY });
      await r.prepareToRecordAsync();
      r.record();
      setRecorder(r);
      setIsRecording(true);
    } catch (e) {}
  };

  const stopRecording = async () => {
    try {
      if (recorder) {
        await recorder.stop();
        const state = recorder.getStatus();
        const candidate = typeof recorder.uri === 'string' && recorder.uri ? recorder.uri : (typeof state?.url === 'string' ? state.url : null);
        const persistentKey = await copySoundToPersistentStorage(normalizeSoundUri(candidate) ?? candidate ?? null);
        if (persistentKey) setRecordedSoundUri(normalizeSoundStorageKey(persistentKey));
        else setRecordedSoundUri(normalizeSoundStorageKey(candidate));
        setIsRecording(false);
        setRecorder(null);
        await setAudioModeAsync({ allowsRecording: false });
      }
    } catch (e) {}
  };

  const playRecorded = async () => {
    try {
      await stopCurrentSpeech();
      await stopCurrentSound();
      await initializeAudio();
      
      await setIsAudioActiveAsync(true);
      // First priority: recorded sound (current session)
      if (recordedSoundUri) {
        const looksLikeUri = isLikelySoundUri(recordedSoundUri);
        if (looksLikeUri) {
          const player = createAudioPlayer({ uri: normalizeSoundUri(recordedSoundUri) || recordedSoundUri }, { keepAudioSessionActive: true });
          player.play();
          const sub = player.addListener('playbackStatusUpdate', (status: any) => {
            if (status?.isLoaded && status?.didJustFinish) {
              try { player.remove(); } catch {}
              try { player.release(); } catch {}
              setIsAudioActiveAsync(false).catch(() => {});
              sub.remove();
            }
          });
          return;
        } else {
          await playWord(recordedSoundUri, { ttsEnabled: settings?.textToSpeech, locale, text: wordText || undefined });
          return;
        }
      }

      // Second priority: saved sound from wordList (for edit mode)
      if (isEditMode && typeof editIndex === 'number' && editIndex >= 0 && editIndex < wordList.length) {
        const fromList = wordList[editIndex] as any;
        if (fromList?.sound) {
          const rawSound = typeof fromList.sound === 'string' ? fromList.sound : String(fromList.sound);
          const normalizedFromListSound = normalizeSoundUri(rawSound);
          if (normalizedFromListSound && isLikelySoundUri(normalizedFromListSound)) {
            const player = createAudioPlayer({ uri: normalizedFromListSound }, { keepAudioSessionActive: true });
            player.play();
            const sub = player.addListener('playbackStatusUpdate', (status: any) => {
              if (status?.isLoaded && status?.didJustFinish) {
                try { player.remove(); } catch {}
                try { player.release(); } catch {}
                setIsAudioActiveAsync(false).catch(() => {});
                sub.remove();
              }
            });
            return;
          } else {
            const fallbackKey = normalizedFromListSound ?? rawSound;
            await playWord(fallbackKey, { ttsEnabled: settings?.textToSpeech, locale, text: wordText || undefined });
            return;
          }
        }
      }

      // Fallback: bundled sound by image key or text
      const textKey = (wordText || '').trim().toLowerCase();
      const imageKeyCandidate = imageKey || '';
      const looksLikeUri = typeof imageKeyCandidate === 'string' && (
        imageKeyCandidate.startsWith('http') ||
        imageKeyCandidate.startsWith('file:') ||
        isPersistentImageKey(imageKeyCandidate)
      );
      const finalKey = (!looksLikeUri && imageKeyCandidate) ? imageKeyCandidate : textKey;
      if (finalKey) {
        await playWord(finalKey, { ttsEnabled: settings?.textToSpeech, locale, text: wordText || undefined });
      }
    } catch (e) {}
  };

  const handleCopy = () => {
    if (!isEditMode || typeof editIndex !== 'number' || editIndex < 0 || editIndex >= wordList.length) {
      return;
    }

    // Copy the current word
    const wordToCopy = wordList[editIndex] as any;
    const copiedWord = {
      image: normalizeImageStorageKey(wordToCopy.image ?? 'ball') ?? 'ball',
      text: wordToCopy.text ?? '',
      sound: normalizeSoundStorageKey(wordToCopy.sound ?? null),
    };

    // Add to word list
    setWordList([...wordList, copiedWord]);
    
    // Signal to scroll to bottom
    setShouldScrollToBottom(true);
    
    // Go back
    router.back();
  };

  const handleSave = () => {
    const trimmed = wordText.trim();
    if (!trimmed) {
      router.back();
      return;
    }

    if (isEditMode && typeof editIndex === 'number' && editIndex >= 0 && editIndex < wordList.length) {
      const updated = [...wordList];
      const prev: any = updated[editIndex];
      const newSound = normalizeSoundStorageKey(recordedSoundUri ?? prev?.sound ?? null);
      const storedImageKey = normalizeImageStorageKey(imageKey ?? prev.image ?? 'ball') ?? 'ball';
      
      updated[editIndex] = { 
        image: storedImageKey, 
        text: prev.text, // Keep original key
        sound: newSound,
        translations: updateWordTranslation(prev, trimmed)
      } as any;
      setWordList(updated);
    } else {
      // New word - save with current locale as default
      const storedImageKey = normalizeImageStorageKey(imageKey ?? 'ball') ?? 'ball';
      setWordList([...wordList, { 
        image: storedImageKey, 
        text: trimmed, 
        sound: normalizeSoundStorageKey(recordedSoundUri),
        translations: undefined
      } as any]);
    }

    router.back();
  };

  useEffect(() => {
    navigation.setOptions({
      title: '',
      headerTitleAlign: 'center',
      headerTitle: () => (
        <Pressable
          onPress={isEditMode ? handleCopy : undefined}
          disabled={!isEditMode}
          style={({ pressed }) => ({
            opacity: !isEditMode ? 0.4 : (pressed ? 0.5 : 1),
          })}
        >
          <SFProText weight="semibold" style={{ color: '#4664CD', fontSize: 16 }}>
            {t('buttons.copy')}
          </SFProText>
        </Pressable>
      ),
      headerLeft: () => (
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => ({
            opacity: pressed ? 0.5 : 1,
            paddingHorizontal: Platform.OS === 'ios' && parseInt(Platform.Version as string) >= 26 ? 4 : 0,
          })}
        >
          <SFProText weight="semibold" style={{ color: '#4664CD', fontSize: 16 }}>
            {t('buttons.cancel')}
          </SFProText>
        </Pressable>
      ),
      headerRight: () => (
        <Pressable
          onPress={canSave ? handleSave : undefined}
          style={({ pressed }) => ({
            opacity: canSave ? (pressed ? 0.5 : 1) : 0.4,
            paddingHorizontal: Platform.OS === 'ios' && parseInt(Platform.Version as string) >= 26 ? 4 : 0,
          })}
        >
          <SFProText weight="semibold" style={{ color: '#4664CD', fontSize: 16 }}>
            {t('buttons.save')}
          </SFProText>
        </Pressable>
      ),
    });
  }, [navigation, isEditMode, wordText, imageKey, recordedSoundUri, canSave]);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={[styles.container, !onTablet && styles.containerPhone, onTablet && styles.containerTablet, { paddingBottom: insets.bottom + 12 }]}>
        <View style={[!onTablet && !onPhoneLandscape && styles.contentPhone]}>
          {onPhoneLandscape ? (
            <View style={styles.landscapeRow}>
              <View style={styles.landCol}>
                <View style={styles.group}>
                  <TextInput
                    value={wordText}
                    onChangeText={setWordText}
                    placeholder={t('wordDetails.newWord')}
                    placeholderTextColor="#757575"
                    style={[styles.input, !onTablet && styles.inputPhone, onTablet && styles.inputTablet, { fontFamily: getSpecialLettersFontFamily() }]}
                  />
                </View>
                {settings?.recordNewSounds && (
                  <View style={styles.group}>
                    <View style={[styles.row, !onTablet && styles.rowPhone]}>
                      <Pressable style={[styles.actionBtn, !onTablet && styles.actionBtnPhone]} onPress={isRecording ? stopRecording : startRecording}>
                        <Image source={require('../assets/images/record-icon.png')} style={styles.actionIcon} />
                        <View style={styles.labelWrap}>
                          <SFProText
                            weight="semibold"
                            style={styles.actionText}
                            numberOfLines={1}
                            adjustsFontSizeToFit
                          >
                            {isRecording ? t('wordDetails.stopRecording') : t('wordDetails.recordSound')}
                          </SFProText>
                        </View>
                      </Pressable>
                      <Pressable style={[styles.actionBtn, !onTablet && styles.actionBtnPhone]} onPress={playRecorded}>
                        <Image source={require('../assets/images/play-icon.png')} style={styles.actionIcon} />
                        <View style={styles.labelWrap}>
                          <SFProText
                            weight="semibold"
                            style={styles.actionText}
                            numberOfLines={1}
                            adjustsFontSizeToFit
                          >
                            {t('wordDetails.playSound')}
                          </SFProText>
                        </View>
                      </Pressable>
                    </View>
                  </View>
                )}
              </View>
              <View style={styles.landCol}>
                <View style={styles.group}>
                <View style={[styles.imageBox, !onTablet && styles.imageBoxPhone, onTablet && styles.imageBoxTablet]}>
                  {imageKey ? (
                    <Image
                      source={resolveImageSource(imageKey) || WORD_IMAGES['ball']}
                      style={onTablet ? { width: 357, height: 237 } : { width: 215, height: 159 }}
                      resizeMode="cover"
                      resizeMethod="resize"
                      fadeDuration={0}
                    />
                  ) : (
                      <Image source={require('../assets/images/upload-icon.png')} style={{ width: onTablet ? 78 : 60, height: onTablet ? 78 : 60 }} resizeMode="contain" />
                    )}
                  </View>
                  <View style={[styles.row, !onTablet && styles.rowPhone, onTablet && styles.rowTablet]}>
                    <Pressable style={[styles.actionBtn, !onTablet && styles.actionBtnPhone, onTablet && styles.actionBtnTablet]} onPress={pickFromGallery}>
                      <Image source={require('../assets/images/gallery-icon.png')} style={styles.actionIcon} />
                      <View style={styles.labelWrap}>
                        <SFProText
                          weight="semibold"
                          style={styles.actionText}
                          numberOfLines={1}
                          adjustsFontSizeToFit
                        >
                          {t('wordDetails.choosePicture')}
                        </SFProText>
                      </View>
                    </Pressable>
                    <Pressable style={[styles.actionBtn, !onTablet && styles.actionBtnPhone, onTablet && styles.actionBtnTablet]} onPress={takePhoto}>
                      <Image source={require('../assets/images/camera-icon.png')} style={styles.actionIcon} />
                      <View style={styles.labelWrap}>
                        <SFProText
                          weight="semibold"
                          style={styles.actionText}
                          numberOfLines={1}
                          adjustsFontSizeToFit
                        >
                          {t('wordDetails.takePicture')}
                        </SFProText>
                      </View>
                    </Pressable>
                  </View>
                </View>
              </View>
            </View>
          ) : (
            <>
              <View style={styles.group}>
                <TextInput
                  value={wordText}
                  onChangeText={setWordText}
                  placeholder={t('wordDetails.newWord')}
                  placeholderTextColor="#757575"
                  style={[styles.input, !onTablet && styles.inputPhone, onTablet && styles.inputTablet, { fontFamily: getSpecialLettersFontFamily() }]}
                />
              </View>

              <View style={[styles.group, onTablet && styles.groupTablet]}>
                <View style={[styles.imageBox, !onTablet && styles.imageBoxPhone, onTablet && styles.imageBoxTablet]}>
                  {imageKey ? (
                    <Image
                      source={resolveImageSource(imageKey) || WORD_IMAGES['ball']}
                      style={onTablet ? { width: 357, height: 237 } : { width: 215, height: 159 }}
                      resizeMode="cover"
                      resizeMethod="resize"
                      fadeDuration={0}
                    />
                  ) : (
                    <Image source={require('../assets/images/upload-icon.png')} style={{ width: onTablet ? 78 : 60, height: onTablet ? 78 : 60 }} resizeMode="contain" />
                  )}
                </View>
                <View style={[styles.row, !onTablet && styles.rowPhone, onTablet && styles.rowTablet]}>
                  <Pressable style={[styles.actionBtn, !onTablet && styles.actionBtnPhone, onTablet && styles.actionBtnTablet]} onPress={pickFromGallery}>
                    <Image source={require('../assets/images/gallery-icon.png')} style={styles.actionIcon} />
                    <View style={styles.labelWrap}>
                      <SFProText
                        weight="semibold"
                        style={styles.actionText}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                      >
                        {t('wordDetails.choosePicture')}
                      </SFProText>
                    </View>
                  </Pressable>
                  <Pressable style={[styles.actionBtn, !onTablet && styles.actionBtnPhone, onTablet && styles.actionBtnTablet]} onPress={takePhoto}>
                    <Image source={require('../assets/images/camera-icon.png')} style={styles.actionIcon} />
                    <View style={styles.labelWrap}>
                      <SFProText
                        weight="semibold"
                        style={styles.actionText}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                      >
                        {t('wordDetails.takePicture')}
                      </SFProText>
                    </View>
                  </Pressable>
                </View>
              </View>

              {settings?.recordNewSounds && (
                <View style={styles.group}>
                  <View style={[styles.row, !onTablet && styles.rowPhone, onTablet && styles.rowTablet]}>
                    <Pressable style={[styles.actionBtn, !onTablet && styles.actionBtnPhone, onTablet && styles.actionBtnTablet]} onPress={isRecording ? stopRecording : startRecording}>
                      <Image source={require('../assets/images/record-icon.png')} style={styles.actionIcon} />
                      <View style={styles.labelWrap}>
                      <SFProText
                      weight="semibold"
                      style={styles.actionText}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      >
                        {isRecording ? t('wordDetails.stopRecording') : t('wordDetails.recordSound')}
                        </SFProText>
                        </View>
                    </Pressable>
                    <Pressable style={[styles.actionBtn, !onTablet && styles.actionBtnPhone, onTablet && styles.actionBtnTablet]} onPress={playRecorded}>
                      <Image source={require('../assets/images/play-icon.png')} style={styles.actionIcon} />
                      <View style={styles.labelWrap}>
                        <SFProText
                          weight="semibold"
                          style={styles.actionText}
                          numberOfLines={1}
                          adjustsFontSizeToFit
                        >
                          {t('wordDetails.playSound')}
                        </SFProText>
                      </View>
                    </Pressable>
                  </View>
                </View>
              )}
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
  containerTablet: {
    paddingTop: 73,
    alignItems: 'center',
  },
  containerPhone: {
    alignItems: 'center',
  },
  contentPhone: {
    width: 215,
  },
  landscapeRow: {
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'center',
  },
  landCol: {
    width: 215,
  },
  group: {
    marginBottom: 38,
  },
  groupTablet: {
    marginBottom: 60,
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
    width: 215,
    height: 52,
  },
  inputTablet: {
    width: 357,
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
    width: 215,
    height: 159,
    overflow: 'hidden',
  },
  imageBoxTablet: {
    width: 357,
    height: 237,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  rowPhone: {
    gap: 7,
  },
  rowTablet: {
    gap: 12,
  },
  actionBtn: {
    backgroundColor: '#233D91',
    borderRadius: 4,
    paddingHorizontal: 7,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  actionBtnPhone: {
    width: 105,
    height: 36,
    paddingHorizontal: 7,
  },
  actionBtnTablet: {
    width: 172,
    height: 36,
    paddingHorizontal: 7,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 15,
    textAlign: 'center',
    includeFontPadding: false,
  },
  labelWrap: {
    flexShrink: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIcon: {
    width: 20,
    height: 20,
    flexShrink: 0,
    marginRight: 6,
  },
});
