import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useEffect } from 'react';
import { Alert, Image, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { resetWordList, isWordListEdited } = useSettings();

  // Set navigation header with settings button
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          onPress={() => router.navigate('/settings')}
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
    Alert.alert('Documentation', 'View online documentation feature');
  };

  const handleManageProfiles = () => {
    Alert.alert('Profiles', 'Manage profiles feature');
  };

  const handleExportWordList = () => {
    Alert.alert('Export', 'Export word list feature');
  };

  const handleImportWordList = () => {
    Alert.alert('Import', 'Import word list feature');
  };

  const handleReset = () => {
    if (!isWordListEdited) {
      Alert.alert('No Changes', 'The word list has not been modified.');
      return;
    }

    Alert.alert(
      'Reset Word List',
      'Are you sure you want to reset the word list to its original order? This will undo all your changes.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset', 
          style: 'destructive',
          onPress: () => {
            resetWordList();
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            Alert.alert('Success', 'Word list has been reset to original order.');
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
      <View style={styles.content}>
        <ActionItem
          icon={require('../assets/images/documentation-icon.png')}
          title="View Online Documentation"
          onPress={handleViewDocumentation}
        />
        
        <ActionItem
          icon={require('../assets/images/profile-icon.png')}
          title="Manage Profiles"
          onPress={handleManageProfiles}
        />
        
        <ActionItem
          icon={require('../assets/images/export-icon.png')}
          title="Export Word List"
          onPress={handleExportWordList}
        />
        
        <ActionItem
          icon={require('../assets/images/import-icon.png')}
          title="Import Word List"
          onPress={handleImportWordList}
        />
        
        <ActionItem
          icon={require('../assets/images/reset-icon.png')}
          title="Reset"
          onPress={handleReset}
          isDestructive={true}
          showChevron={false}
        />
      </View>
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
