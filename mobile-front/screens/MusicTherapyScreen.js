import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import { Card, Title, Text, Button, List, IconButton, ActivityIndicator, Portal, Modal, Menu } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import Slider from '@react-native-community/slider';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { API_URL } from '../config';

const PLAYLISTS_DATA = [
  {
    id: '1',
    title: 'Relaxation & Calm',
    description: 'Soothing melodies to help you relax and find inner peace',
    duration: '25 min',
    tracks: [
      {
        id: '1-1',
        title: 'Arriving',
        duration: '5:30',
        audioFile: require('../assets/Music Therapy/Arriving.mp3')
      },
      {
        id: '1-2',
        title: 'Ascending Dawn Sky',
        duration: '6:15',
        audioFile: require('../assets/Music Therapy/Ascending, Dawn Sky.mp3')
      },
      {
        id: '1-3',
        title: 'Deep In The Glowing Heart',
        duration: '7:20',
        audioFile: require('../assets/Music Therapy/Deep In The Glowing Heart.mp3')
      }
    ]
  },
  {
    id: '2',
    title: 'Ambient Journey',
    description: 'Immersive ambient soundscapes for deep focus and meditation',
    duration: '35 min',
    tracks: [
      {
        id: '2-1',
        title: 'Love Flows Over Us',
        duration: '8:45',
        audioFile: require('../assets/Music Therapy/Love Flows Over Us In Prismatic Waves.mp3')
      },
      {
        id: '2-2',
        title: 'Tayos Caves I',
        duration: '6:30',
        audioFile: require('../assets/Music Therapy/Tayos Caves, Ecuador i.mp3')
      },
      {
        id: '2-3',
        title: 'Tayos Caves II',
        duration: '7:15',
        audioFile: require('../assets/Music Therapy/Tayos Caves, Ecuador ii.mp3')
      },
      {
        id: '2-4',
        title: 'Tayos Caves III',
        duration: '8:00',
        audioFile: require('../assets/Music Therapy/Tayos Caves, Ecuador iii.mp3')
      }
    ]
  }
];

const MusicTherapyScreen = ({ navigation }) => {
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [currentTrack, setCurrentTrack] = useState(null);
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [tempSliderPosition, setTempSliderPosition] = useState(0);
  const [speed, setSpeed] = useState(1.0);
  const [speedMenuVisible, setSpeedMenuVisible] = useState(false);

  useEffect(() => {
    setPlaylists(PLAYLISTS_DATA);
    setLoading(false);
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  const formatTime = (millis) => {
    if (!millis) return '--:--';
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const handleSelectTrack = async (track) => {
    try {
      if (sound) {
        await sound.unloadAsync();
      }
      setCurrentTrack(track);
      setPosition(0);
      setDuration(0);
      setIsPlaying(false);
      setSpeed(1.0);
      setLoading(true);

      const { sound: newSound } = await Audio.Sound.createAsync(
        track.audioFile,
        { 
          progressUpdateIntervalMillis: 1000,
          rate: 1.0,
          shouldCorrectPitch: true
        },
        onPlaybackStatusUpdate
      );
      setSound(newSound);
      
      const status = await newSound.getStatusAsync();
      if (status.isLoaded) {
        setDuration(status.durationMillis);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading audio:', error);
      Alert.alert('Error', 'Failed to load audio track');
      setLoading(false);
    }
  };

  const onPlaybackStatusUpdate = (status) => {
    if (status.isLoaded && !isSeeking) {
      setPosition(status.positionMillis);
      setDuration(status.durationMillis);
      if (status.didJustFinish) {
        setIsPlaying(false);
        setPosition(0);
      }
    }
  };

  const handleSeek = async (value) => {
    if (!sound) return;
    try {
      await sound.setPositionAsync(value);
      setPosition(value);
    } catch (error) {
      console.error('Error seeking:', error);
      Alert.alert('Error', 'Failed to seek to position');
    }
  };

  const handleSpeedChange = async (newSpeed) => {
    if (!sound) return;
    try {
      await sound.setRateAsync(newSpeed, true);
      setSpeed(newSpeed);
      setSpeedMenuVisible(false);
    } catch (error) {
      console.error('Error changing speed:', error);
      Alert.alert('Error', 'Failed to change playback speed');
    }
  };

  const handlePlayPause = async () => {
    if (!sound) return;

    try {
      if (isPlaying) {
        await sound.pauseAsync();
      } else {
        await sound.playAsync();
      }
      setIsPlaying(!isPlaying);
    } catch (error) {
      console.error('Error playing/pausing:', error);
      Alert.alert('Error', 'Failed to play/pause track');
    }
  };

  const handleStop = async () => {
    if (!sound) return;

    try {
      await sound.stopAsync();
      await sound.setPositionAsync(0);
      setIsPlaying(false);
      setPosition(0);
    } catch (error) {
      console.error('Error stopping:', error);
      Alert.alert('Error', 'Failed to stop track');
    }
  };

  const renderPlayer = () => {
    if (!currentTrack) return null;

    return (
      <View style={styles.playerContainer}>
        <Title style={styles.sectionTitle}>Now Playing</Title>
        <Card style={styles.playerCard}>
          <Card.Content>
            <View style={styles.trackHeader}>
              <Icon name="musical-notes" size={24} color="#6200ee" />
              <Title style={styles.trackTitle}>{currentTrack.title}</Title>
            </View>
            
            {loading ? (
              <ActivityIndicator style={styles.loading} />
            ) : (
              <>
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={duration}
                  value={isSeeking ? tempSliderPosition : position}
                  minimumTrackTintColor="#6200ee"
                  maximumTrackTintColor="#000000"
                  thumbTintColor="#6200ee"
                  onSlidingStart={() => {
                    setIsSeeking(true);
                    setTempSliderPosition(position);
                  }}
                  onValueChange={(value) => setTempSliderPosition(value)}
                  onSlidingComplete={(value) => {
                    setIsSeeking(false);
                    handleSeek(value);
                  }}
                />
                
                <View style={styles.timeContainer}>
                  <Text>{formatTime(position)}</Text>
                  <Text>{formatTime(duration)}</Text>
                </View>

                <View style={styles.controls}>
                  <Menu
                    visible={speedMenuVisible}
                    onDismiss={() => setSpeedMenuVisible(false)}
                    anchor={
                      <Button
                        mode="outlined"
                        onPress={() => setSpeedMenuVisible(true)}
                        style={styles.speedButton}
                      >
                        {speed}x
                      </Button>
                    }
                  >
                    {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((rate) => (
                      <Menu.Item
                        key={rate}
                        onPress={() => handleSpeedChange(rate)}
                        title={`${rate}x`}
                      />
                    ))}
                  </Menu>

                  <Button 
                    mode="contained" 
                    onPress={handlePlayPause}
                    style={styles.controlButton}
                    disabled={loading}
                  >
                    {isPlaying ? 'Pause' : 'Play'}
                  </Button>

                  <Button 
                    mode="outlined" 
                    onPress={handleStop}
                    style={styles.controlButton}
                    disabled={loading}
                  >
                    Stop
                  </Button>
                </View>
              </>
            )}
          </Card.Content>
        </Card>
      </View>
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Card style={styles.headerCard}>
          <Card.Content>
            <Title>Music Therapy</Title>
            <Text style={styles.headerDescription}>
              Listen to therapeutic music to improve your mood and well-being
            </Text>
          </Card.Content>
        </Card>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {renderPlayer()}

        {playlists.map((playlist) => (
          <Card key={playlist.id} style={styles.playlistCard}>
            <Card.Content>
              <View style={styles.playlistHeader}>
                <View style={styles.playlistInfo}>
                  <Title style={styles.playlistTitle}>{playlist.title}</Title>
                  <Text style={styles.playlistDuration}>{playlist.duration}</Text>
                </View>
              </View>
              <Text style={styles.playlistDescription}>
                {playlist.description}
              </Text>
              <List.Accordion title="Tracks">
                {playlist.tracks.map((track) => (
                  <List.Item
                    key={track.id}
                    title={track.title}
                    description={track.duration}
                    left={props => <List.Icon {...props} icon="music" />}
                    onPress={() => handleSelectTrack(track)}
                    right={props => 
                      currentTrack?.id === track.id ? (
                        <IconButton
                          {...props}
                          icon={isPlaying ? "pause" : "play"}
                          onPress={handlePlayPause}
                        />
                      ) : (
                        <IconButton
                          {...props}
                          icon="play"
                          onPress={() => handleSelectTrack(track)}
                        />
                      )
                    }
                  />
                ))}
              </List.Accordion>
            </Card.Content>
          </Card>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCard: {
    margin: 16,
    elevation: 2,
  },
  headerDescription: {
    color: '#666',
    marginTop: 8,
  },
  playerContainer: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 20,
    marginBottom: 16,
  },
  playerCard: {
    elevation: 4,
  },
  trackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  trackTitle: {
    marginLeft: 8,
    fontSize: 18,
  },
  slider: {
    width: '100%',
    height: 40,
    marginVertical: 10,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButton: {
    marginHorizontal: 8,
    minWidth: 100,
  },
  speedButton: {
    marginHorizontal: 8,
  },
  loading: {
    marginVertical: 16,
  },
  playlistCard: {
    margin: 16,
    marginTop: 0,
    elevation: 2,
  },
  playlistHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  playlistInfo: {
    flex: 1,
  },
  playlistTitle: {
    fontSize: 18,
  },
  playlistDuration: {
    color: '#666',
  },
  playlistDescription: {
    marginBottom: 16,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    margin: 16,
  }
});

export default MusicTherapyScreen;