import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { PaperProvider } from 'react-native-paper';
import * as Notifications from 'expo-notifications';
import { Alert, Platform } from 'react-native';
import { Audio } from 'expo-av';

// Import Real Screens
import WelcomeScreen from './screens/WelcomeScreen';
import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';
import HomeScreen from './screens/HomeScreen';
import ProfileScreen from './screens/ProfileScreen';
import JournalScreen from './screens/JournalScreen';
import JournalDetailScreen from './screens/JournalDetailScreen';
import NewJournalScreen from './screens/NewJournalScreen';
import MoodTrackerScreen from './screens/MoodTrackerScreen';
import NewMoodScreen from './screens/NewMoodScreen';
import EmergencySupportScreen from './screens/EmergencySupportScreen';
import TherapyScreen from './screens/TherapyScreen';

// Import newly required screens based on HomeScreen links
import GuidedMeditationScreen from './screens/GuidedMeditationScreen';
import SedonaMethodScreen from './screens/SedonaMethodScreen';
import MusicTherapyScreen from './screens/MusicTherapyScreen';
import RemindersScreen from './screens/RemindersScreen';
import WaterRemindersScreen from './screens/WaterRemindersScreen';
import SupportResourcesScreen from './screens/SupportResourcesScreen';

// Import Custom Header
import CustomHeader from './components/CustomHeader';

// Configure Notification Handling
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true, 
    shouldSetBadge: false,
  }),
});

// Function to request permissions
async function registerForPushNotificationsAsync() {
  let token;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    Alert.alert('Permissions Required', 'Failed to get push token for push notification! Please enable notifications in your device settings.');
    return;
  }

  return token;
}

const Stack = createStackNavigator();

export default function App() {
  // Request permissions on mount
  useEffect(() => {
    registerForPushNotificationsAsync();
  }, []);

  useEffect(() => {
    // Set up audio mode for playback
    const setupAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: true,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
      } catch (error) {
        console.error('Failed to set audio mode:', error);
      }
    };

    setupAudio();
  }, []);

  return (
    <PaperProvider>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={({ route, navigation }) => ({
            header: ({ scene, previous, navigation }) => {
              return (
                <CustomHeader 
                  title={route.name} 
                  navigation={navigation} 
                  showBack={route.name !== 'Home'} 
                />
              );
            },
          })}
        >
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="Journal" component={JournalScreen} />
          <Stack.Screen name="JournalDetail" component={JournalDetailScreen} />
          <Stack.Screen name="NewJournal" component={NewJournalScreen} />
          <Stack.Screen name="MoodTracker" component={MoodTrackerScreen} />
          <Stack.Screen name="NewMood" component={NewMoodScreen} />
          <Stack.Screen name="EmergencySupport" component={EmergencySupportScreen} />
          <Stack.Screen name="SupportResources" component={SupportResourcesScreen} options={{ title: 'Support Resources' }} />
          <Stack.Screen name="Therapy" component={TherapyScreen} />
          <Stack.Screen name="GuidedMeditation" component={GuidedMeditationScreen} />
          <Stack.Screen name="SedonaMethod" component={SedonaMethodScreen} />
          <Stack.Screen name="MusicTherapy" component={MusicTherapyScreen} />
          <Stack.Screen name="Reminders" component={RemindersScreen} />
          <Stack.Screen name="WaterReminders" component={WaterRemindersScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
}
