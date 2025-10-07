import { useFonts } from 'expo-font';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Image, Platform, Pressable, Text } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SettingsProvider } from '../src/contexts/SettingsContext';
import { JostText } from '../src/theme/typography';

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
        <StatusBar style="auto" />
        <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#FBFBFE' }, // default for all screens
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
                Special Words
              </JostText>
            ),
            headerRight: () => (
              <Pressable
                onPress={() => router.navigate('/settings') }
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
             title: 'Word List',
             headerTitleAlign: 'center', // Align center
             headerTintColor: '#4664CD', // button/back color
             headerTitleStyle: {
               fontFamily: 'SF-Pro-Display-Semibold',
               fontSize: 15,
               color: '#000', // title color black
             },
           }}
         />

         <Stack.Screen
           name="settings"
           options={{
             title: 'Settings',
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
                 <Text style={{ color: '#4664CD', fontSize: 16 }}>Close</Text>
               </Pressable>
             ),
           }}
         />

         <Stack.Screen
           name="extra-actions"
           options={{
             title: 'Extra Actions',
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
                 <Text style={{ color: '#4664CD', fontSize: 16 }}>Back</Text>
               </Pressable>
             ),
             headerRight: () => (
               <Pressable
                 onPress={() => router.navigate('/settings')}
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
    </SettingsProvider>
    </GestureHandlerRootView>
  );
}