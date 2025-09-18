import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Image, Pressable } from 'react-native';
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
    <>
      <StatusBar style="auto" />
      <Stack>
        <Stack.Screen
          name="index"
          options={{
            title: '',
            headerStyle: {
              backgroundColor: '#4134BF05',
            },
            headerShadowVisible: false,
            headerTintColor: '#000',
            headerLeft: () => (
              <JostText 
                weight="semibold"
                style={{ 
                  fontSize: 18,
                  color: '#000'
                }}
              >
                Special Words
              </JostText>
            ),
            headerRight: () => (
              <Pressable 
                onPress={() => {}}
                style={({ pressed }) => ({
                  opacity: pressed ? 0.5 : 1
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
            title: 'Match Pictures',
            headerStyle: { backgroundColor: '#279095' },
            headerTintColor: '#FFFFFF',
            headerTitleStyle: { fontFamily: 'SF-Pro-Display-Semibold', fontSize: 18 },
          }}
        />
        <Stack.Screen
          name="match-words"
          options={{
            title: 'Match Words',
            headerStyle: { backgroundColor: '#9893CA' },
            headerTintColor: '#FFFFFF',
            headerTitleStyle: { fontFamily: 'SF-Pro-Display-Semibold', fontSize: 18 },
          }}
        />
        <Stack.Screen
          name="word-to-picture"
          options={{
            title: 'Word to Picture',
            headerStyle: { backgroundColor: '#954D27' },
            headerTintColor: '#FFFFFF',
            headerTitleStyle: { fontFamily: 'SF-Pro-Display-Semibold', fontSize: 18 },
          }}
        />
        <Stack.Screen
          name="picture-to-word"
          options={{
            title: 'Picture to Word',
            headerStyle: { backgroundColor: '#273F95' },
            headerTintColor: '#FFFFFF',
            headerTitleStyle: { fontFamily: 'SF-Pro-Display-Semibold', fontSize: 18 },
          }}
        />
        <Stack.Screen
          name="sound-to-picture"
          options={{
            title: 'Sound to Picture',
            headerStyle: { backgroundColor: '#952769' },
            headerTintColor: '#FFFFFF',
            headerTitleStyle: { fontFamily: 'SF-Pro-Display-Semibold', fontSize: 18 },
          }}
        />
        <Stack.Screen
          name="sound-to-word"
          options={{
            title: 'Sound to Word',
            headerStyle: { backgroundColor: '#4C9527' },
            headerTintColor: '#FFFFFF',
            headerTitleStyle: { fontFamily: 'SF-Pro-Display-Semibold', fontSize: 18 },
          }}
        />
        <Stack.Screen
          name="word-list"
          options={{
            title: 'Word List',
            headerStyle: { backgroundColor: '#6675AA' },
            headerTintColor: '#FFFFFF',
            headerTitleStyle: { fontFamily: 'SF-Pro-Display-Semibold', fontSize: 18 },
          }}
        />
      </Stack>
    </>
  );
}