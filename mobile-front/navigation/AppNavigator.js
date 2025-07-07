import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import JournalScreen from '../screens/JournalScreen';
import MoodTrackerScreen from '../screens/MoodTrackerScreen';
import NewMoodScreen from '../screens/NewMoodScreen';
import GuidedMeditationScreen from '../screens/GuidedMeditationScreen';
import SedonaMethodScreen from '../screens/SedonaMethodScreen';
import MusicTherapyScreen from '../screens/MusicTherapyScreen';
import RemindersScreen from '../screens/RemindersScreen';
import WaterRemindersScreen from '../screens/WaterRemindersScreen';
import SupportResourcesScreen from '../screens/SupportResourcesScreen';
import EmergencySupportScreen from '../screens/EmergencySupportScreen';
import JournalDetailScreen from '../screens/JournalDetailScreen';

// Import community screens
import CommunityScreen from '../screens/CommunityScreen';
import TopicThreadsScreen from '../screens/TopicThreadsScreen';
import ThreadDetailScreen from '../screens/ThreadDetailScreen';
import NewThreadScreen from '../screens/NewThreadScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Create a separate stack for Community screens
const CommunityStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="CommunityHome" 
        component={CommunityScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Journal') iconName = focused ? 'book' : 'book-outline';
          else if (route.name === 'Community') iconName = focused ? 'people' : 'people-outline';
          else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Journal" component={JournalScreen} />
      <Tab.Screen name="Community" component={CommunityStack} options={{ headerShown: false }} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

// Main app stack
const AppNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen name="JournalDetail" component={JournalDetailScreen} />
      <Stack.Screen name="NewMood" component={NewMoodScreen} />
      <Stack.Screen name="GuidedMeditation" component={GuidedMeditationScreen} />
      <Stack.Screen name="SedonaMethod" component={SedonaMethodScreen} />
      <Stack.Screen name="MusicTherapy" component={MusicTherapyScreen} />
      <Stack.Screen name="Reminders" component={RemindersScreen} />
      <Stack.Screen name="WaterReminders" component={WaterRemindersScreen} />
      <Stack.Screen name="SupportResources" component={SupportResourcesScreen} />
      <Stack.Screen name="EmergencySupport" component={EmergencySupportScreen} />
    </Stack.Navigator>
  );
};

export default AppNavigator;