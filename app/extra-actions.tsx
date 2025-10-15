import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Image, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CustomAlertDialog from '../src/components/CustomAlertDialog';
import { useSettings } from '../src/contexts/SettingsContext';
import { SFProText } from '../src/theme/typography';
import { isTablet } from '../src/utils/device';

interface ActionItemProps {
  icon: any;
  title: string;
  onPress: () => void;
  isDestructive?: boolean;
  showChevron?: boolean;
}

const ActionItem: React.FC<ActionItemProps> = ({ icon, title, onPress, isDestructive = false, showChevron = true }) => {
  const tablet = isTablet();
  const itemHeight = tablet ? 60 : 50;
  
  return (
    <Pressable
      style={[
        styles.actionItem,
        { height: itemHeight },
        isDestructive && styles.destructiveItem
      ]}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
    >
      <Image source={icon} style={styles.actionIcon} resizeMode="contain" />
      <SFProText 
        weight="regular" 
        style={[
          styles.actionText,
          isDestructive && styles.destructiveText
        ]}
      >
        {title}
      </SFProText>
      {showChevron && (
        <Image 
          source={require('../assets/images/chevron-right-black.png')} 
          style={styles.chevronIcon} 
          resizeMode="contain" 
        />
      )}
    </Pressable>
  );
};

export default function ExtraActionsScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { resetWordList, isWordListEdited } = useSettings();

  const [showParentLockDialog, setShowParentLockDialog] = useState(false);

  const handleParentLock = () => {
    setShowParentLockDialog(true);
  };

  const handleSuccess = () => {
    setShowParentLockDialog(false);
    router.push("/settings");
  };

  // Set navigation header with settings button
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          onPress={() => handleParentLock()}
          style={({ pressed }) => ({
            opacity: pressed ? 0.5 : 1,
            marginLeft: Platform.OS === 'ios' && parseInt(Platform.Version as string) >= 26 ? 6 : 0,
          })}
        >
          <Image
            source={require('../assets/images/settings-icon.png')}
            style={{ width: 24, height: 24 }}
          />
        </Pressable>
      ),
    });
  }, [navigation]);

  const handleViewDocumentation = () => {
    Alert.alert(t('documentation.title'), t('extraActions.viewDocumentation'));
  };

  const handleManageProfiles = () => {
    Alert.alert(t('profiles.profiles'), t('extraActions.manageProfiles'));
  };

  const handleExportWordList = () => {
    Alert.alert(t('extraActions.exportWordList'), t('extraActions.chooseFormat'));
  };

  const handleImportWordList = () => {
    Alert.alert(t('extraActions.importWordList'), t('extraActions.useMailApp'));
  };

  const handleReset = () => {
    if (!isWordListEdited) {
      Alert.alert(t('wordList.noChanges'), t('wordList.noChangesMessage'));
      return;
    }

    Alert.alert(
      t('wordList.resetTitle'),
      t('wordList.resetMessage'),
      [
        { text: t('buttons.cancel'), style: 'cancel' },
        { 
          text: t('buttons.reset'), 
          style: 'destructive',
          onPress: () => {
            resetWordList();
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            Alert.alert(t('wordList.successTitle'), t('wordList.successMessage'));
          }
        }
      ]
    );
  };

  return (
    <View style={[
      styles.container, 
      { 
        paddingLeft: insets.left,
        paddingRight: insets.right,
      }
    ]}>
      <ScrollView
              contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
              showsVerticalScrollIndicator={false}
      >
          <View style={styles.content}>
            <ActionItem
              icon={require('../assets/images/documentation-icon.png')}
              title={t('extraActions.viewDocumentation')}
              onPress={handleViewDocumentation}
            />

            <ActionItem
              icon={require('../assets/images/profile-icon.png')}
              title={t('extraActions.manageProfiles')}
              onPress={handleManageProfiles}
            />

            <ActionItem
              icon={require('../assets/images/export-icon.png')}
              title={t('extraActions.exportWordList')}
              onPress={handleExportWordList}
            />

            <ActionItem
              icon={require('../assets/images/import-icon.png')}
              title={t('extraActions.importWordList')}
              onPress={handleImportWordList}
            />

            <ActionItem
              icon={require('../assets/images/reset-icon.png')}
              title={t('buttons.reset')}
              onPress={handleReset}
              isDestructive={true}
              showChevron={false}
            />
          </View>
      </ScrollView>

      <CustomAlertDialog
              visible={showParentLockDialog}
              onCancel={() => setShowParentLockDialog(false)}
              onSuccess={handleSuccess}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 17,
    paddingTop: 21,
  },
  actionItem: {
    backgroundColor: '#ffffff',
    borderRadius: 15,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    justifyContent: 'space-between',
    shadowColor: '#3629B7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 30,
    elevation: 4,
  },
  destructiveItem: {
    backgroundColor: '#F54B4B',
  },
  actionIcon: {
    width: 24,
    height: 24,
  },
  actionText: {
    flex: 1,
    fontSize: 14,
    color: '#000000',
    paddingLeft: 8,
  },
  destructiveText: {
    color: '#FFFFFF',
  },
  chevronIcon: {
    width: 12,
    height: 12,
  },
});
