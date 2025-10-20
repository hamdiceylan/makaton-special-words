import Constants from 'expo-constants';
import { Image } from 'expo-image';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Slider from '@react-native-community/slider';
import {
  Dimensions,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSettings } from '../src/contexts/SettingsContext';
const { width: screenWidth } = Dimensions.get('window');

interface SettingItem {
  id: string;
  title: string;
  type: 'toggle' | 'slider' | 'navigation' | 'info';
  value?: boolean | string | number;
  onPress?: () => void;
}

interface SettingSection {
  title: string;
  items: SettingItem[];
}

export default function Settings() {
  const { t } = useTranslation();
  const { 
    settings, 
    toggleSetting, 
    animationSpeed, 
    setAnimationSpeed, 
    cardsPerPage, 
    setCardsPerPage,
    shuffleMode,
    setShuffleMode,
    switchCount,
    setSwitchCount
  } = useSettings();
  const [showCardsPerPageModal, setShowCardsPerPageModal] = useState(false);
  const [showShuffleModeModal, setShowShuffleModeModal] = useState(false);
  const [showSwitchCountModal, setShowSwitchCountModal] = useState(false);

  const handleAnimationSpeedChange = (value: number) => {
    const clampedValue = Math.min(1, Math.max(0, value));
    setAnimationSpeed(clampedValue);
  };

  const sections: SettingSection[] = [
    {
      title: t('settings.animationSpeed'),
      items: [
        {
          id: 'animationSpeed',
          title: '',
          type: 'slider',
          value: animationSpeed,
        },
      ],
    },
    {
      title: t('settings.advancingToNextPage'),
      items: [
        {
          id: 'automatic',
          title: t('settings.automatic'),
          type: 'toggle',
          value: settings.automatic,
        },
      ],
    },
    {
      title: t('settings.usingSound'),
      items: [
        {
          id: 'playBeforeMatch',
          title: t('settings.playBeforeMatch'),
          type: 'toggle',
          value: settings.playBeforeMatch,
        },
        {
          id: 'playAfterMatch',
          title: t('settings.playAfterMatch'),
          type: 'toggle',
          value: settings.playAfterMatch,
        },
        {
          id: 'recordNewSounds',
          title: t('settings.recordNewSounds'),
          type: 'toggle',
          value: settings.recordNewSounds,
        },
        {
          id: 'textToSpeech',
          title: t('settings.textToSpeech'),
          type: 'toggle',
          value: settings.textToSpeech,
        },
      ],
    },
    {
      title: t('settings.otherOptions'),
      items: [
        {
          id: 'font',
          title: t('settings.font'),
          type: 'navigation',
          value: 'Special Letters',
        },
        {
          id: 'capitalLetters',
          title: t('settings.capitalLetters'),
          type: 'toggle',
          value: settings.capitalLetters,
        },
        {
          id: 'largeText',
          title: t('settings.largeText'),
          type: 'toggle',
          value: settings.largeText,
        },
        {
          id: 'enableEditing',
          title: t('settings.enableEditing'),
          type: 'toggle',
          value: settings.enableEditing,
        },
        {
          id: 'enableReward',
          title: t('settings.enableReward'),
          type: 'toggle',
          value: settings.enableReward,
        },
        {
          id: 'shuffleCards',
          title: t('settings.shuffleCards'),
          type: 'navigation',
          value: shuffleMode === 'off' ? t('settings.off') : shuffleMode === 'page' ? t('settings.page') : t('settings.all'),
          onPress: () => setShowShuffleModeModal(true),
        },
        {
          id: 'cardsPerPage',
          title: t('settings.cardsPerPage'),
          type: 'navigation',
          value: cardsPerPage.toString(),
          onPress: () => setShowCardsPerPageModal(true),
        },
        {
          id: 'switches',
          title: t('settings.switches'),
          type: 'navigation',
          value: switchCount.toString(),
          onPress: () => setShowSwitchCountModal(true),
        },
        {
          id: 'enableDebugging',
          title: t('settings.enableDebugging'),
          type: 'toggle',
          value: settings.enableDebugging,
        },
      ],
    },
    {
      title: t('settings.about'),
      items: [
        {
          id: 'registration',
          title: t('settings.registration'),
          type: 'navigation',
        },
        {
          id: 'version',
          title: t('settings.version'),
          type: 'info',
          value: `${Constants.expoConfig?.version || '1.0.0'} (${Constants.expoConfig?.ios?.buildNumber || Constants.expoConfig?.android?.versionCode || '1'})`,
        },
        {
          id: 'acknowledgements',
          title: t('settings.acknowledgements'),
          type: 'navigation',
        },
      ],
    },
  ];

  const renderSlider = () => (
    <View style={styles.sliderContainer}>
      <Image
        source={require('../assets/images/decrease-icon.png')}
        style={styles.sliderIcon}
      />
      <Slider
        style={styles.sliderControl}
        value={animationSpeed}
        onValueChange={handleAnimationSpeedChange}
        minimumValue={0}
        maximumValue={1}
        minimumTrackTintColor="#4664CD"
        maximumTrackTintColor="#B0B0B0"
        thumbTintColor="#4664CD"
      />
      <Image
        source={require('../assets/images/increase-icon.png')}
        style={styles.sliderIcon}
      />
    </View>
  );

  const renderToggle = (item: SettingItem) => (
    <View style={styles.toggleContainer}>
      <Switch
        value={item.value as boolean}
        onValueChange={() => toggleSetting(item.id as keyof typeof settings)}
        trackColor={{ false: '#E5E5EA', true: '#4664CD' }}
        thumbColor={item.value ? '#FFFFFF' : '#FFFFFF'}
        ios_backgroundColor="#E5E5EA"
      />
    </View>
  );

  const renderNavigation = (item: SettingItem) => (
    <View style={styles.navigationContainer}>
      <Text style={styles.navigationValue}>{item.value}</Text>
      <Image
        source={require('../assets/images/chevron-right.png')}
        style={styles.chevron}
      />
    </View>
  );

  const renderInfo = (item: SettingItem) => (
    <Text style={styles.infoValue}>{item.value}</Text>
  );

  const renderItem = (item: SettingItem) => {
    switch (item.type) {
      case 'slider':
        return renderSlider();
      case 'toggle':
        return renderToggle(item);
      case 'navigation':
        return renderNavigation(item);
      case 'info':
        return renderInfo(item);
      default:
        return null;
    }
  };

  const cardsPerPageOptions = [1, 2, 3, 4, 6, 8];
  const shuffleOptions: { key: 'off' | 'page' | 'all'; label: string }[] = [
    { key: 'off', label: t('settings.off') },
    { key: 'page', label: t('settings.page') },
    { key: 'all', label: t('settings.all') },
  ];
  const switchCountOptions = [0, 1, 2, 3];

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', ...(Platform.OS === 'android' ? ['bottom' as const] : [])]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {sections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionWrapper}>
              <View style={styles.sectionContainer}>
                {section.items.map((item, itemIndex) => (
                  <Pressable
                    key={item.id}
                    style={[
                      styles.settingItem,
                      itemIndex === section.items.length - 1 && styles.lastItem,
                    ]}
                    onPress={item.onPress}
                    disabled={item.type === 'info' || item.type === 'slider'}
                  >
                    {item.type !== 'slider' && <Text style={styles.settingTitle}>{item.title}</Text>}
                    {renderItem(item)}
                  </Pressable>
                ))}
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      <Modal
        visible={showCardsPerPageModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCardsPerPageModal(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setShowCardsPerPageModal(false)}
        >
          <Pressable 
            style={styles.modalContent}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHandle} />
            {cardsPerPageOptions.map((option) => (
              <Pressable
                key={option}
                style={styles.modalOption}
                onPress={() => {
                  setCardsPerPage(option);
                  setShowCardsPerPageModal(false);
                }}
              >
                <Text style={[
                  styles.modalOptionText,
                  cardsPerPage === option && styles.modalOptionTextSelected
                ]}>
                  {option}
                </Text>
                {cardsPerPage === option && (
                  <Image
                    source={require('../assets/images/check-icon.png')}
                    style={styles.checkIcon}
                  />
                )}
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={showShuffleModeModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowShuffleModeModal(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setShowShuffleModeModal(false)}
        >
          <Pressable 
            style={styles.modalContent}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHandle} />
            {shuffleOptions.map((option) => (
              <Pressable
                key={option.key}
                style={styles.modalOption}
                onPress={() => {
                  setShuffleMode(option.key);
                  setShowShuffleModeModal(false);
                }}
              >
                <Text style={[
                  styles.modalOptionText,
                  shuffleMode === option.key && styles.modalOptionTextSelected
                ]}>
                  {option.label}
                </Text>
                {shuffleMode === option.key && (
                  <Image
                    source={require('../assets/images/check-icon.png')}
                    style={styles.checkIcon}
                  />
                )}
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={showSwitchCountModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSwitchCountModal(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setShowSwitchCountModal(false)}
        >
          <Pressable 
            style={styles.modalContent}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHandle} />
            {switchCountOptions.map((option) => (
              <Pressable
                key={option}
                style={styles.modalOption}
                onPress={() => {
                  setSwitchCount(option);
                  setShowSwitchCountModal(false);
                }}
              >
                <Text style={[
                  styles.modalOptionText,
                  switchCount === option && styles.modalOptionTextSelected
                ]}>
                  {option === 0 ? t('settings.off') : `${option} ${option > 1 ? t('settings.switchPlural') : t('settings.switch')}`}
                </Text>
                {switchCount === option && (
                  <Image
                    source={require('../assets/images/check-icon.png')}
                    style={styles.checkIcon}
                  />
                )}
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
    paddingTop: 28,
    paddingBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionWrapper: {
    marginHorizontal: 16,
    marginBottom: 8,
    shadowColor: '#3629B7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 30,
    elevation: 4,
  },
  sectionContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '400',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginHorizontal: 16,
  },
  settingItem: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#F5F5F5',
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  settingTitle: {
    fontSize: 16,
    fontFamily: 'SF-Pro-Display-Medium',
    color: '#000000',
    flex: 1,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  sliderControl: {
    flex: 1,
    marginHorizontal: 12,
  },
  sliderIcon: {
    width: 25,
    height: 25,
  },
  toggleContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  navigationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navigationValue: {
    fontSize: 16,
    fontFamily: 'SF-Pro-Display-Medium',
    color: '#757575',
    marginRight: 8.5,
  },
  chevron: {
    width: 5,
    height: 11,
    tintColor: '#757575',
  },
  infoValue: {
    fontSize: 16,
    color: '#8E8E93',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(122, 122, 122, 0.3)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    paddingBottom: 60,
    paddingHorizontal: 36,
  },
  modalHandle: {
    width: 36,
    height: 4,
    backgroundColor: '#C7C7CC',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: 'SF-Pro-Display-Medium',
    color: '#000000',
    marginBottom: 20,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
    paddingLeft: 0,
    paddingRight: 15,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F5F5F5',
  },
  modalOptionText: {
    fontSize: 16,
    fontFamily: 'SF-Pro-Display-Regular',
    color: '#000000',
  },
  modalOptionTextSelected: {
    color: '#4664CD',
    fontFamily: 'SF-Pro-Display-Medium',
  },
  checkIcon: {
    width: 16,
    height: 16,
    tintColor: '#4664CD',
  },
});
