import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from "react";
import { useTranslation } from 'react-i18next';
import { Image, Platform, Pressable, Text } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import CustomAlertDialog from '../src/components/CustomAlertDialog';
import { SettingsProvider } from '../src/contexts/SettingsContext';
import '../src/i18n/i18n';
import { JostText } from '../src/theme/typography';

function RootLayoutContent() {
  const router = useRouter();
  const { t } = useTranslation();
  const [showParentLockDialog, setShowParentLockDialog] = useState(false);

  const handleParentLock = () => {
    setShowParentLockDialog(true);
  };

  const handleSuccess = () => {
    setShowParentLockDialog(false);
    router.push("/settings");
  };

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#FBFBFE' },
          headerShadowVisible: false,
          headerTintColor: '#000',
          headerTitleStyle: {
            fontFamily: 'SF-Pro-Display-Semibold',
            fontSize: 18,
            color: '#000',
          },
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: '',
            headerLeft: () => (
              <JostText
                weight="semibold"
                style={{
                  fontSize: 18,
                  color: '#000',
                }}
              >
                {t('app.name')}
              </JostText>
            ),
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
          }}
        />
  
        <Stack.Screen 
          name="match-pictures" 
          options={{ 
            title: '',
            headerTitle: '',
            headerLeft: () => null,
            headerBackVisible: false,
            headerRight: () => (
              <Pressable
                onPress={() => router.back()}
                style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
              >
                <Image
                  source={require('../assets/images/close-circle-icon.png')}
                  style={{ width: 30, height: 30 }}
                />
              </Pressable>
            ),
            presentation: 'fullScreenModal',
            headerShown: true,
          }} 
        />

        <Stack.Screen 
          name="match-words"
          options={{ 
            title: '',
            headerTitle: '',
            headerLeft: () => null,
            headerBackVisible: false,
            headerRight: () => (
              <Pressable
                onPress={() => router.back()}
                style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
              >
                <Image
                  source={require('../assets/images/close-circle-icon.png')}
                  style={{ width: 30, height: 30 }}
                />
              </Pressable>
            ),
            presentation: 'fullScreenModal',
            headerShown: true,
          }} 
        />

        <Stack.Screen 
          name="word-to-picture"
          options={{ 
            title: '',
            headerTitle: '',
            headerLeft: () => null,
            headerBackVisible: false,
            headerRight: () => (
              <Pressable
                onPress={() => router.back()}
                style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
              >
                <Image
                  source={require('../assets/images/close-circle-icon.png')}
                  style={{ width: 30, height: 30 }}
                />
              </Pressable>
            ),
            presentation: 'fullScreenModal',
            headerShown: true,
          }} 
        />

        <Stack.Screen 
          name="picture-to-word"
          options={{ 
            title: '',
            headerTitle: '',
            headerLeft: () => null,
            headerBackVisible: false,
            headerRight: () => (
              <Pressable
                onPress={() => router.back()}
                style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
              >
                <Image
                  source={require('../assets/images/close-circle-icon.png')}
                  style={{ width: 30, height: 30 }}
                />
              </Pressable>
            ),
            presentation: 'fullScreenModal',
            headerShown: true,
          }} 
        />
        
        <Stack.Screen 
          name="sound-to-picture"
          options={{ 
            title: '',
            headerTitle: '',
            headerLeft: () => null,
            headerBackVisible: false,
            headerRight: () => (
              <Pressable
                onPress={() => router.back()}
                style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
              >
                <Image
                  source={require('../assets/images/close-circle-icon.png')}
                  style={{ width: 30, height: 30 }}
                />
              </Pressable>
            ),
            presentation: 'fullScreenModal',
            headerShown: true,
          }} 
        />

        <Stack.Screen 
          name="sound-to-word"
          options={{ 
            title: '',
            headerTitle: '',
            headerLeft: () => null,
            headerBackVisible: false,
            headerRight: () => (
              <Pressable
                onPress={() => router.back()}
                style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
              >
                <Image
                  source={require('../assets/images/close-circle-icon.png')}
                  style={{ width: 30, height: 30 }}
                />
              </Pressable>
            ),
            presentation: 'fullScreenModal',
            headerShown: true,
          }} 
        />

        <Stack.Screen
          name="word-list"
          options={{
            title: t('tabs.wordList'),
            headerTitleAlign: 'center',
            headerTintColor: '#4664CD',
            headerTitleStyle: {
              fontFamily: 'SF-Pro-Display-Semibold',
              fontSize: 15,
              color: '#000',
            },
          }}
        />

        <Stack.Screen
          name="settings"
          options={{
            title: t('buttons.settings'),
            headerTitleAlign: 'center',
            headerTintColor: '#4664CD',
            headerTitleStyle: {
              fontFamily: 'SF-Pro-Display-Medium',
              fontSize: 16,
              color: '#000',
            },
            headerLeft: () => (
              <Pressable
                onPress={() => router.back()}
                style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
              >
                <Text style={{ color: '#4664CD', fontSize: 16 }}>{t('buttons.close')}</Text>
              </Pressable>
            ),
          }}
        />

        <Stack.Screen
          name="extra-actions"
          options={{
            title: t('extraActions.title'),
            headerTitleAlign: 'center',
            headerTintColor: '#4664CD',
            headerTitleStyle: {
              fontFamily: 'SF-Pro-Display-Semibold',
              fontSize: 18,
              color: '#000',
            },
            headerLeft: () => (
              <Pressable
                onPress={() => router.back()}
                style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
              >
                <Text style={{ color: '#4664CD', fontSize: 16 }}>{t('buttons.back')}</Text>
              </Pressable>
            ),
            headerRight: () => (
              <Pressable
                onPress={() => handleParentLock()}
                style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
              >
                <Image
                  source={require('../assets/images/settings-icon.png')}
                  style={{ width: 20, height: 20 }}
                />
              </Pressable>
            ),
          }}
        />
      </Stack>

      <CustomAlertDialog
        visible={showParentLockDialog}
        onCancel={() => setShowParentLockDialog(false)}
        onSuccess={handleSuccess}
      />
    </>
  );
}

// Dış component - Provider wrapper
export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    // Jost fonts
    'Jost-Regular': require('../assets/fonts/Jost/Jost-Regular.ttf'),
    'Jost-Medium': require('../assets/fonts/Jost/Jost-Medium.ttf'),
    'Jost-SemiBold': require('../assets/fonts/Jost/Jost-SemiBold.ttf'),
    'Jost-Bold': require('../assets/fonts/Jost/Jost-Bold.ttf'),
    'Jost-ExtraBold': require('../assets/fonts/Jost/Jost-ExtraBold.ttf'),
    'Jost-Black': require('../assets/fonts/Jost/Jost-Black.ttf'),

    // SF Pro fonts
    'SF-Pro-Display-Regular': require('../assets/fonts/SF-pro/SF-Pro-Display-Regular.otf'),
    'SF-Pro-Display-Medium': require('../assets/fonts/SF-pro/SF-Pro-Display-Medium.otf'),
    'SF-Pro-Display-Semibold': require('../assets/fonts/SF-pro/SF-Pro-Display-Semibold.otf'),
    'SF-Pro-Display-Bold': require('../assets/fonts/SF-pro/SF-Pro-Display-Bold.otf'),
    'SF-Pro-Display-Heavy': require('../assets/fonts/SF-pro/SF-Pro-Display-Heavy.otf'),
    'SF-Pro-Display-Black': require('../assets/fonts/SF-pro/SF-Pro-Display-Black.otf'),
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SettingsProvider>
        <RootLayoutContent />
      </SettingsProvider>
    </GestureHandlerRootView>
  );
}