import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Platform, Linking, Alert } from 'react-native';
import { Card, Title, Text, Avatar, ActivityIndicator, IconButton, Button, Surface, ProgressBar } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '../config';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';

const HomeScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dailyQuote, setDailyQuote] = useState({ text: '', author: '' });
  const [moodData, setMoodData] = useState({ currentMood: 'neutral', streak: 0 });
  const [quoteLoading, setQuoteLoading] = useState(true);
  const [quoteError, setQuoteError] = useState(null);
  const [moodError, setMoodError] = useState('');
  const [username, setUsername] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [showMoodBanner, setShowMoodBanner] = useState(false);
  const [showJournalBanner, setShowJournalBanner] = useState(false);
  const [showWaterBanner, setShowWaterBanner] = useState(false);
  const [waterProgress, setWaterProgress] = useState({ currentIntakeMl: 0, goalMl: 3700 });

  useEffect(() => {
    const initializeScreen = async () => {
      setLoading(true);
      await loadUserData();
      await fetchDailyQuote();
      setLoading(false);
    };
    initializeScreen();
  }, []);

  const loadUserData = useCallback(async () => {
    try {
      const userDataString = await AsyncStorage.getItem('userData');
      if (userDataString) {
        const userData = JSON.parse(userDataString);
        setUser(userData);
        setUsername(userData.username || '');
        setProfileImage(userData.profile_image || null);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      setUsername('');
      setProfileImage(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      console.log("[HomeScreen] Focus detected, reloading profile data.");
      loadUserData();
      fetchDailyQuote(); // Added quote fetch on screen focus
    });

    return unsubscribe;
  }, [navigation, loadUserData, fetchDailyQuote]);

  const fallbackQuotes = [
    { text: "Your mental health is a priority. Your happiness is essential. Your self-care is a necessity.", author: "Unknown" },
    { text: "You are not alone in this journey. Every step forward is progress.", author: "Unknown" },
    { text: "Self-care is not selfish. You cannot serve from an empty vessel.", author: "Eleanor Brown" },
    { text: "It's okay to take a moment to rest and recharge.", author: "Unknown" },
    { text: "Your feelings are valid. Your emotions matter. Your journey is important.", author: "Unknown" },
    { text: "Small steps still move you forward. Progress isn't always visible, but it's happening.", author: "Unknown" },
    { text: "You are stronger than you think and braver than you believe.", author: "A.A. Milne" },
    { text: "Recovery is not linear. Be patient with yourself.", author: "Unknown" },
    { text: "Every day is a new beginning. Take a deep breath and start again.", author: "Unknown" },
    { text: "Your worth is not measured by your productivity.", author: "Unknown" },
    { text: "It's okay to not be okay. It's okay to ask for help.", author: "Unknown" },
    { text: "Peace begins with a smile.", author: "Mother Teresa" },
    { text: "You don't have to control your thoughts. You just have to stop letting them control you.", author: "Dan Millman" },
    { text: "The greatest glory in living lies not in never falling, but in rising every time we fall.", author: "Nelson Mandela" },
    { text: "Happiness can be found even in the darkest of times if one only remembers to turn on the light.", author: "Albus Dumbledore" },
    { text: "Your present circumstances don't determine where you can go; they merely determine where you start.", author: "Nido Qubein" },
    { text: "Be gentle with yourself. You're doing the best you can.", author: "Unknown" },
    { text: "The sun will rise, and we will try again.", author: "Unknown" },
    { text: "Sometimes the smallest step in the right direction ends up being the biggest step of your life.", author: "Unknown" },
    { text: "You are worthy of peace, joy, and all things good.", author: "Unknown" }
  ];

  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);

  // Add this useEffect for quote rotation
  useEffect(() => {
    const rotateQuotes = setInterval(() => {
      setCurrentQuoteIndex((prevIndex) => (prevIndex + 1) % fallbackQuotes.length);
    }, 15000); // Rotate every 15 seconds

    return () => clearInterval(rotateQuotes);
  }, []);

  const fetchDailyQuote = async () => {
    setQuoteLoading(true);
    setQuoteError('');
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) throw new Error('Authentication required');

      const response = await axios.get(`${API_URL}/quotes`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data && response.data.text && response.data.author) {
        setDailyQuote(response.data);
      } else {
        // Silently fall back to local quotes
        setDailyQuote(fallbackQuotes[currentQuoteIndex]);
      }
    } catch (error) {
      // Silently fall back to local quotes without logging the error
      setDailyQuote(fallbackQuotes[currentQuoteIndex]);
    } finally {
      setQuoteLoading(false);
    }
  };

  const fetchMoodData = async () => {
    setMoodError('');
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) throw new Error('No token');

      const response = await axios.get(`${API_URL}/moods`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        const latestMood = response.data[response.data.length - 1];
        setMoodData({
          currentMood: latestMood.mood,
          streak: response.data.length
        });
      } else {
        setMoodData({ currentMood: 'neutral', streak: 0 });
      }
    } catch (error) {
      console.error('Error fetching mood data:', error);
      setMoodError('Could not load mood data.');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUserData();
    await fetchDailyQuote();
    await fetchMoodData();
    setRefreshing(false);
  };

  const allFeatures = [
    { 
      key: 'MoodTracker', 
      title: 'Mood Tracker', 
      icon: 'happy-outline', 
      screen: 'MoodTracker',
      description: 'Track your daily moods'
    },
    { 
      key: 'Journal', 
      title: 'Journal', 
      icon: 'book-outline', 
      screen: 'Journal',
      description: 'Write your thoughts'
    },
    { 
      key: 'GuidedMeditation', 
      title: 'Meditation', 
      icon: 'leaf-outline', 
      screen: 'GuidedMeditation',
      description: 'Practice guided meditation'
    },
    { 
      key: 'SedonaMethod', 
      title: 'Sedona Method', 
      icon: 'heart-outline', 
      screen: 'SedonaMethod',
      description: 'Learn the Sedona Method technique'
    },
    { 
      key: 'MusicTherapy', 
      title: 'Music Therapy', 
      icon: 'musical-notes-outline', 
      screen: 'MusicTherapy',
      description: 'Listen to therapeutic music'
    },
    { 
      key: 'MindfulnessReminders', 
      title: 'Reminders', 
      icon: 'notifications-outline', 
      screen: 'Reminders',
      description: 'Set mindfulness practice reminders'
    },
    { 
      key: 'WaterReminders', 
      title: 'Water Intake', 
      icon: 'water-outline', 
      screen: 'WaterReminders',
      description: 'Track your daily water intake'
    },
    { 
      key: 'ProfessionalSupport', 
      title: 'Support', 
      icon: 'medkit-outline', 
      screen: 'SupportResources',
      description: 'Access professional support resources'
    },
    { 
      key: 'EmergencyButton', 
      title: 'Emergency Support',
      icon: 'alert-circle-outline', 
      screen: 'EmergencySupport',
      color: '#FFFFFF',
      backgroundColor: '#D32F2F',
      description: 'Get immediate support in crisis'
    },
  ];

  const emergencyFeature = allFeatures.find(f => f.key === 'EmergencyButton');
  const mainFeatures = allFeatures.filter(f => f.key !== 'EmergencyButton');

  const renderFeatureGrid = () => {
    return (
      <View style={styles.featuresGrid}>
        {mainFeatures.map((feature) => (
          <Card 
            key={feature.key} 
            style={styles.featureCard} 
            onPress={() => {
              if (feature.screen) {
                navigation.navigate(feature.screen);
              }
            }}
          >
            <Card.Content style={styles.featureContent}>
              <Icon 
                name={feature.icon} 
                size={32} 
                color={feature.color || "#6200ee"} 
              />
              <Text style={styles.featureText}>{feature.title}</Text>
            </Card.Content>
          </Card>
        ))}
      </View>
    );
  };

  const renderEmergencyButton = () => {
    if (!emergencyFeature) return null;
    return (
      <Button
        mode="contained"
        icon={emergencyFeature.icon} 
        style={[styles.emergencyButton, { backgroundColor: emergencyFeature.backgroundColor || '#D32F2F' }]}
        labelStyle={styles.emergencyButtonLabel}
        contentStyle={styles.emergencyButtonContent}
        onPress={() => {
          if (emergencyFeature.screen) {
            navigation.navigate(emergencyFeature.screen);
          }
        }}
      >
        {emergencyFeature.title}
      </Button>
    );
  };

  const renderHeader = () => {
    return (
      <View style={styles.headerContainer}>
        <View style={styles.headerLeft}>
          {profileImage ? (
            <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
              <Avatar.Image 
                size={40} 
                source={{ uri: `data:image/jpeg;base64,${profileImage}` }} 
                style={styles.avatar}
              />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
              <Avatar.Text 
                size={40} 
                label={(username || 'W').substring(0, 2).toUpperCase()} 
                style={styles.avatar}
              />
            </TouchableOpacity>
          )}
          <View style={styles.headerTextContainer}></View>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.usernameText}>{username || 'Friend'}!</Text>
        </View>
        <IconButton
          icon="cog-outline"
          size={30}
          onPress={() => navigation.navigate('Profile')}
          color="#6200ee"
        />
      </View>
    );
  };

  const renderQuoteWidget = () => {
    if (quoteLoading) return <ActivityIndicator style={styles.quoteWidgetCard} />;
    
    // Always show a quote - either from API or fallback
    const quoteToShow = dailyQuote.text ? dailyQuote : fallbackQuotes[currentQuoteIndex];

    return (
      <Card style={styles.quoteWidgetCard} onPress={fetchDailyQuote}>
        <Card.Content>
          <Text style={styles.quoteWidgetText}>"{quoteToShow.text}"</Text>
          {quoteToShow.author && quoteToShow.author !== 'Unknown' && (
            <Text style={styles.quoteWidgetAuthor}>- {quoteToShow.author}</Text>
          )}
        </Card.Content>
        <Card.Actions style={styles.quoteActions}>
          <IconButton icon="refresh" size={20} onPress={fetchDailyQuote} />
        </Card.Actions>
      </Card>
    );
  };

  const handleEmergencyPress = () => {
    Alert.alert(
      '  Emergency Support',
      'Are you experiencing a mental health emergency?',
      [
        { text: 'Call Emergency Services', onPress: () => Linking.openURL('tel:1122') },
        { text: 'View Crisis Resources', onPress: () => navigation.navigate('SupportResources') },
        { text: 'Cancel', style: 'cancel' }
      ],
      { cancelable: true }
    );
  };

  useEffect(() => {
    const checkDailyActivities = async () => {
      const currentDate = new Date().toLocaleDateString();
      const lastMoodDate = await AsyncStorage.getItem('lastMoodDate');
      const lastJournalDate = await AsyncStorage.getItem('lastJournalDate');
      
      // Check mood entry
      setShowMoodBanner(lastMoodDate !== currentDate);
      
      // Check journal entry
      setShowJournalBanner(lastJournalDate !== currentDate);

      // Check water intake
      await checkWaterIntake();
    };

    // Initial check
    checkDailyActivities();

    // Set up screen focus listener to recheck when screen is focused
    const unsubscribe = navigation.addListener('focus', () => {
      checkDailyActivities();
    });
    
    // Check water intake every hour
    const waterCheckInterval = setInterval(() => checkWaterIntake(), 3600000);
    
    return () => {
      clearInterval(waterCheckInterval);
      unsubscribe();
    };
  }, [navigation]);

  const checkWaterIntake = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      const response = await axios.get(`${API_URL}/water/progress`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data) {
        const progress = response.data;
        setWaterProgress(progress);
        // Show banner if less than 75% of daily goal and hasn't been dismissed
        setShowWaterBanner(progress.currentIntakeMl < (progress.goalMl * 0.75));
      }
    } catch (error) {
      console.error('Error checking water intake:', error);
    }
  };

  const renderBanners = () => {
    return (
      <View style={styles.bannerContainer}>
        <Surface style={[styles.bannerSurface, showMoodBanner && styles.bannerVisible]}>
          <View style={styles.bannerWrapper}>
            <View style={styles.bannerContent}>
              <View style={styles.bannerIconContainer}>
                <Icon name="happy-outline" size={24} color="#6200ee" />
              </View>
              <View style={styles.bannerTextContainer}>
                <Text style={styles.bannerTitle}>Time for a mood check!</Text>
                <Text style={styles.bannerDescription}>How are you feeling today?</Text>
              </View>
              <View style={styles.bannerActions}>
                <Button
                  mode="contained"
                  onPress={() => {
                    navigation.navigate('MoodTracker');
                    setShowMoodBanner(false);
                  }}
                  style={styles.bannerButton}
                  labelStyle={styles.bannerButtonLabel}
                >
                  Log Mood
                </Button>
                <IconButton
                  icon="close"
                  size={20}
                  onPress={() => setShowMoodBanner(false)}
                  style={styles.bannerDismiss}
                />
              </View>
            </View>
          </View>
        </Surface>

        <Surface style={[styles.bannerSurface, showJournalBanner && styles.bannerVisible]}>
          <View style={styles.bannerWrapper}>
            <View style={styles.bannerContent}>
              <View style={styles.bannerIconContainer}>
                <Icon name="book-outline" size={24} color="#4CAF50" />
              </View>
              <View style={styles.bannerTextContainer}>
                <Text style={styles.bannerTitle}>Write in Your Journal</Text>
                <Text style={styles.bannerDescription}>Take a moment to reflect on your day</Text>
              </View>
              <View style={styles.bannerActions}>
                <Button
                  mode="contained"
                  onPress={() => {
                    navigation.navigate('NewJournal');
                    setShowJournalBanner(false);
                  }}
                  style={[styles.bannerButton, { backgroundColor: '#4CAF50' }]}
                  labelStyle={styles.bannerButtonLabel}
                >
                  Write Entry
                </Button>
                <IconButton
                  icon="close"
                  size={20}
                  onPress={() => setShowJournalBanner(false)}
                  style={styles.bannerDismiss}
                />
              </View>
            </View>
          </View>
        </Surface>

        <Surface style={[styles.bannerSurface, showWaterBanner && styles.bannerVisible]}>
          <View style={styles.bannerWrapper}>
            <View style={styles.bannerContent}>
              <View style={styles.bannerIconContainer}>
                <Icon name="water-outline" size={24} color="#2196F3" />
              </View>
              <View style={styles.bannerTextContainer}>
                <Text style={styles.bannerTitle}>Stay Hydrated!</Text>
                <Text style={styles.bannerDescription}>
                  {`${waterProgress.currentIntakeMl}ml of ${waterProgress.goalMl}ml goal`}
                </Text>
                <ProgressBar
                  progress={waterProgress.currentIntakeMl / waterProgress.goalMl}
                  color="#2196F3"
                  style={styles.bannerProgress}
                />
              </View>
              <View style={styles.bannerActions}>
                <Button
                  mode="contained"
                  onPress={() => {
                    navigation.navigate('WaterReminders');
                    setShowWaterBanner(false);
                  }}
                  style={[styles.bannerButton, { backgroundColor: '#2196F3' }]}
                  labelStyle={styles.bannerButtonLabel}
                >
                  Add Water
                </Button>
                <IconButton
                  icon="close"
                  size={20}
                  onPress={() => setShowWaterBanner(false)}
                  style={styles.bannerDismiss}
                />
              </View>
            </View>
          </View>
        </Surface>
      </View>
    );
  };

  if (loading && !user) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator animating={true} size="large" color="#6200ee" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {renderBanners()}
        {renderEmergencyButton()}
        <Text style={styles.welcomeMessage}>Welcome back, {user?.username || 'Friend'}!</Text>
        {renderQuoteWidget()}
        <Title style={styles.featuresTitle}>Explore Features</Title>
        {renderFeatureGrid()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#DDDDDD',
  },
  avatar: {
    backgroundColor: '#6200ee',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
  },
  scrollView: {
    flex: 1,
  },
  scrollContentContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  welcomeMessage: {
    fontSize: 18,
    fontWeight: '500',
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 5,
    color: '#333',
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 16,
    marginTop: 15,
    marginBottom: 10,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },
  featureCard: {
    width: '45%',
    marginVertical: 8,
    elevation: 2,
    borderRadius: 8,
  },
  featureContent: {
    alignItems: 'center',
    padding: 10,
  },
  featureText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  featureDescription: {
    marginTop: 4,
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  quoteWidgetCard: {
    marginHorizontal: 16,
    marginTop: 15,
    marginBottom: 5,
    elevation: 2,
    borderRadius: 8,
  },
  quoteWidgetText: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#495057',
    marginBottom: 5,
    textAlign: 'center',
  },
  quoteWidgetAuthor: {
    fontSize: 14,
    textAlign: 'right',
    color: '#6C757D',
    marginTop: 5,
  },
  quoteActions: {
    justifyContent: 'flex-end',
  },
  errorText: {
    color: '#DC3545',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
    padding: 10,
  },
  emergencyButton: {
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 10,
    paddingVertical: 8,
    borderRadius: 8,
    elevation: 3,
  },
  emergencyButtonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 10,
  },
  emergencyButtonContent: {
    height: 50,
  },
  headerTextContainer: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 16,
    color: '#6C757D',
  },
  usernameText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#343A40',
  },
  bannerContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  bannerSurface: {
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: '#FFF',
    elevation: 2,
  },
  bannerVisible: {
    marginVertical: 8,
  },
  bannerWrapper: {
    overflow: 'hidden',
    borderRadius: 12,
  },
  bannerContent: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  bannerIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  bannerTextContainer: {
    flex: 1,
    marginRight: 8,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  bannerDescription: {
    fontSize: 14,
    color: '#666',
  },
  bannerProgress: {
    height: 4,
    borderRadius: 2,
    marginTop: 8,
  },
  bannerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bannerButton: {
    borderRadius: 20,
    marginRight: 4,
  },
  bannerButtonLabel: {
    fontSize: 12,
    marginVertical: 2,
  },
  bannerDismiss: {
    margin: 0,
  },
});

export default HomeScreen;