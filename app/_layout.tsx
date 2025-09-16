import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Image, Pressable } from 'react-native';
import { ThemedText } from '../src/theme/typography';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'Jost-Regular': require('../assets/fonts/Jost-Regular.ttf'),
    'Jost-Medium': require('../assets/fonts/Jost-Medium.ttf'),
    'Jost-SemiBold': require('../assets/fonts/Jost-SemiBold.ttf'),
    'Jost-Bold': require('../assets/fonts/Jost-Bold.ttf'),
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
              <ThemedText 
                weight="semibold"
                style={{ 
                  fontSize: 18,
                  color: '#000'
                }}
              >
                Special Words
              </ThemedText>
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
      </Stack>
    </>
  );
}