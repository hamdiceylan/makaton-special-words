import { Image } from 'expo-image';
import React, { useState } from 'react';
import {
    Dimensions,
    Modal,
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
  const { 
    settings, 
    toggleSetting, 
    animationSpeed, 
    setAnimationSpeed, 
    cardsPerPage, 
    setCardsPerPage 
  } = useSettings();
  
  const [showCardsPerPageModal, setShowCardsPerPageModal] = useState(false);

  const sections: SettingSection[] = [
    {
      title: 'ANIMATION SPEED',
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
      title: 'ADVANCING TO NEXT PAGE',
      items: [
        {
          id: 'automatic',
          title: 'Automatic',
          type: 'toggle',
          value: settings.automatic,
        },
      ],
    },
    {
      title: 'USING SOUND',
      items: [
        {
          id: 'playBeforeMatch',
          title: 'Play Before Match',
          type: 'toggle',
          value: settings.playBeforeMatch,
        },
        {
          id: 'playAfterMatch',
          title: 'Play After Match',
          type: 'toggle',
          value: settings.playAfterMatch,
        },
        {
          id: 'recordNewSounds',
          title: 'Record New Sounds',
          type: 'toggle',
          value: settings.recordNewSounds,
        },
        {
          id: 'textToSpeech',
          title: 'Text To Speech',
          type: 'toggle',
          value: settings.textToSpeech,
        },
      ],
    },
    {
      title: 'OTHER OPTIONS',
      items: [
        {
          id: 'font',
          title: 'Font',
          type: 'navigation',
          value: 'Rockwell Bold',
        },
        {
          id: 'capitalLetters',
          title: 'Capital Letters',
          type: 'toggle',
          value: settings.capitalLetters,
        },
        {
          id: 'largeText',
          title: 'Large Text',
          type: 'toggle',
          value: settings.largeText,
        },
        {
          id: 'enableEditing',
          title: 'Enable Editing',
          type: 'toggle',
          value: settings.enableEditing,
        },
        {
          id: 'enableReward',
          title: 'Enable Reward',
          type: 'toggle',
          value: settings.enableReward,
        },
        {
          id: 'shuffleCards',
          title: 'Shuffle Cards',
          type: 'navigation',
          value: 'Off',
        },
        {
          id: 'cardsPerPage',
          title: 'Cards Per Page',
          type: 'navigation',
          value: cardsPerPage.toString(),
          onPress: () => setShowCardsPerPageModal(true),
        },
        {
          id: 'switches',
          title: 'Switches',
          type: 'navigation',
          value: '0',
        },
        {
          id: 'enableDebugging',
          title: 'Enable Debugging',
          type: 'toggle',
          value: settings.enableDebugging,
        },
      ],
    },
    {
      title: 'ABOUT',
      items: [
        {
          id: 'registration',
          title: 'Registration',
          type: 'navigation',
        },
        {
          id: 'version',
          title: 'Version',
          type: 'info',
          value: '4.4.5 (881) (Debug)',
        },
        {
          id: 'acknowledgements',
          title: 'Acknowledgements',
          type: 'navigation',
        },
      ],
    },
  ];

  const renderSlider = () => (
    <View style={styles.sliderContainer}>
      <Pressable
        style={styles.sliderButton}
        onPress={() => setAnimationSpeed(Math.max(0, animationSpeed - 0.1))}
      >
        <Text style={styles.sliderButtonText}>-</Text>
      </Pressable>
      <View style={styles.sliderTrack}>
        <View
          style={[
            styles.sliderProgress,
            { width: `${animationSpeed * 100}%` }
          ]}
        />
        <View
          style={[
            styles.sliderThumb,
            { left: `${animationSpeed * 100}%` }
          ]}
        />
      </View>
      <Pressable
        style={styles.sliderButton}
        onPress={() => setAnimationSpeed(Math.min(1, animationSpeed + 0.1))}
      >
        <Text style={styles.sliderButtonText}>+</Text>
      </Pressable>
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

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
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
  sliderButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sliderButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  sliderTrack: {
    flex: 1,
    height: 2,
    backgroundColor: '#B0B0B0',
    borderRadius: 3,
    marginHorizontal: 12,
    position: 'relative',
  },
  sliderProgress: {
    height: '100%',
    backgroundColor: '#4664CD',
    borderRadius: 2,
  },
  sliderThumb: {
    position: 'absolute',
    top: -6,
    width: 16,
    height: 16,
    borderRadius: 10,
    backgroundColor: '#4664CD',
    marginLeft: -10,
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
