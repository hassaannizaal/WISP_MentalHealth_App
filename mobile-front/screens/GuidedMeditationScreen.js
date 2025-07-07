import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Text, Card, Title, ActivityIndicator, Portal, Modal } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Audio } from 'expo-av';
import Slider from '@react-native-community/slider';

const GuidedMeditationScreen = ({ navigation }) => {
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [loading, setLoading] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showNowPlaying, setShowNowPlaying] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const meditations = [
    {
      id: 1,
      title: 'Breathing Meditation',
      description: 'Calming breathing exercises for stress reduction',
      audioFile: require('../assets/Guided Meditation/Breathing Meditation.mp3'),
      icon: 'weather-windy'
    },
    {
      id: 2,
      title: 'Body Scan',
      description: 'Progressive relaxation for physical tension release',
      audioFile: require('../assets/Guided Meditation/Body Scan.mp3'),
      icon: 'human'
    },
    {
      id: 3,
      title: 'Loving-Kindness',
      description: 'Cultivate compassion and positive emotions',
      audioFile: require('../assets/Guided Meditation/Loving-Kindess.mp3'),
      icon: 'heart'
    },
    {
      id: 4,
      title: 'Mindful Walking',
      description: 'Practice mindfulness through walking meditation',
      audioFile: require('../assets/Guided Meditation/Mindful Walking.mp3'),
      icon: 'walk'
    }
  ];

  // Set up audio mode for robust playback
  useEffect(() => {
    const setupAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          staysActiveInBackground: true,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
      } catch (error) {
        console.error('Error setting up audio:', error);
      }
    };

    setupAudio();
  }, []);

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  // Playback status monitoring
  useEffect(() => {
    if (sound) {
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          setPosition(status.positionMillis);
          setDuration(status.durationMillis);
          setIsPlaying(status.isPlaying);
          
          if (status.didJustFinish) {
            setIsCompleted(true);
            handleMeditationComplete();
          }
        }
      });
    }
  }, [sound]);

  const handleMeditationComplete = () => {
    const currentIndex = meditations.findIndex(m => m.id === currentTrack.id);
    const nextIndex = (currentIndex + 1) % meditations.length;
    const nextMeditation = meditations[nextIndex];
    
    Alert.alert(
      "Meditation Complete",
      "Would you like to continue with the next meditation?",
      [
        {
          text: "No",
          style: "cancel",
          onPress: () => {
            setIsCompleted(true);
            setIsPlaying(false);
          }
        },
        {
          text: "Yes",
          onPress: () => {
            setIsCompleted(false);
            handlePlayPause(nextMeditation);
          }
        }
      ],
      { cancelable: false }
    );
  };

  const formatTime = (millis) => {
    if (!millis) return '0:00';
    const minutes = Math.floor(millis / 60000);
    const seconds = ((millis % 60000) / 1000).toFixed(0);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const onSliderValueChange = async (value) => {
    if (sound && !loading) {
      try {
        await sound.setPositionAsync(value);
        setPosition(value);
      } catch (error) {
        console.error('Error seeking:', error);
      }
    }
  };

  const handlePlayPause = async (meditation) => {
    try {
      setLoading(true);

      // If same track and not completed, resume/pause
      if (currentTrack?.id === meditation.id && !isCompleted) {
        if (isPlaying) {
          await sound.pauseAsync();
          setIsPlaying(false);
        } else {
          await sound.playAsync();
          setIsPlaying(true);
        }
        setLoading(false);
        return;
      }

      // Unload previous sound if exists
      if (sound) {
        await sound.unloadAsync();
      }

      // Load and play new meditation
      const { sound: newSound } = await Audio.Sound.createAsync(
        meditation.audioFile,
        { 
          shouldPlay: true,
          progressUpdateIntervalMillis: 1000,
          positionMillis: 0,
        },
        (status) => {
          if (status.error) {
            console.error(`Error loading sound: ${status.error}`);
          }
        }
      );

      setSound(newSound);
      setCurrentTrack(meditation);
      setIsPlaying(true);
      setIsCompleted(false);
      setPosition(0);
      
    } catch (error) {
      console.error('Error playing meditation:', error);
      Alert.alert('Playback Error', 'Unable to play this meditation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={styles.backButton}
        >
          <Icon name="chevron-left" size={30} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Meditation Library</Text>
      </View>

      <ScrollView style={styles.content}>
        {meditations.map((meditation) => (
          <Card key={meditation.id} style={styles.meditationCard}>
            <Card.Content style={styles.cardContent}>
              <View style={styles.titleContainer}>
                <Icon name={meditation.icon} size={24} color="#6200ee" />
                <Title style={styles.title}>{meditation.title}</Title>
              </View>
              <Text style={styles.description}>{meditation.description}</Text>
              <TouchableOpacity
                style={[
                  styles.playButton,
                  currentTrack?.id === meditation.id && isPlaying && styles.playingButton
                ]}
                onPress={() => handlePlayPause(meditation)}
                disabled={loading}
              >
                {loading && currentTrack?.id === meditation.id ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Icon 
                    name={currentTrack?.id === meditation.id && isPlaying ? 'pause' : 'play'} 
                    size={24} 
                    color="#fff" 
                  />
                )}
              </TouchableOpacity>
            </Card.Content>
          </Card>
        ))}
      </ScrollView>

      <Portal>
        <Modal
          visible={currentTrack !== null}
          onDismiss={() => setCurrentTrack(null)}
          contentContainerStyle={styles.modalContainer}
        >
          {currentTrack && (
            <View style={styles.nowPlayingContainer}>
              <Text style={styles.nowPlayingTitle}>{currentTrack.title}</Text>
              <View style={styles.sliderContainer}>
                <Text style={styles.timeText}>{formatTime(position)}</Text>
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={duration}
                  value={position}
                  onSlidingComplete={onSliderValueChange}
                  minimumTrackTintColor="#6200ee"
                  maximumTrackTintColor="#000000"
                  thumbTintColor="#6200ee"
                />
                <Text style={styles.timeText}>{formatTime(duration)}</Text>
              </View>
              <View style={styles.controlsContainer}>
                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={() => handlePlayPause(currentTrack)}
                >
                  <Icon 
                    name={isPlaying ? 'pause' : 'play'} 
                    size={32} 
                    color="#6200ee" 
                  />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </Modal>
      </Portal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    elevation: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 16,
  },
  backButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  meditationCard: {
    marginBottom: 16,
    elevation: 2,
    borderRadius: 12,
  },
  cardContent: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    marginLeft: 12,
    fontSize: 16,
  },
  description: {
    color: '#666',
    fontSize: 14,
    flex: 1,
    marginHorizontal: 12,
  },
  playButton: {
    backgroundColor: '#6200ee',
    padding: 12,
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playingButton: {
    backgroundColor: '#3700b3',
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 15,
  },
  nowPlayingContainer: {
    alignItems: 'center',
  },
  nowPlayingTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  sliderContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  slider: {
    flex: 1,
    marginHorizontal: 10,
  },
  timeText: {
    fontSize: 12,
    color: '#666',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  controlButton: {
    padding: 10,
  },
});

export default GuidedMeditationScreen;