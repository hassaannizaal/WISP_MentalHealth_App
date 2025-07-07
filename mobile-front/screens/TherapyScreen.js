import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Card, Title, Text, Button, List, Portal, Dialog, ProgressBar } from 'react-native-paper';

const TherapyScreen = ({ navigation }) => {
  const [showSedonaDialog, setShowSedonaDialog] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const musicPlaylists = [
    {
      id: '1',
      title: 'Calming Meditation',
      description: 'Peaceful melodies for deep relaxation',
      duration: '45 min',
      tracks: 8,
    },
    {
      id: '2',
      title: 'Stress Relief',
      description: 'Soothing sounds to reduce anxiety',
      duration: '30 min',
      tracks: 6,
    },
    {
      id: '3',
      title: 'Sleep Better',
      description: 'Gentle music for better sleep',
      duration: '60 min',
      tracks: 10,
    },
  ];

  const sedonaSteps = [
    {
      id: '1',
      title: 'Welcome',
      description: 'Introduction to the Sedona Method',
      duration: '2 min',
    },
    {
      id: '2',
      title: 'Letting Go',
      description: 'Release negative emotions and thoughts',
      duration: '5 min',
    },
    {
      id: '3',
      title: 'Acceptance',
      description: 'Practice accepting the present moment',
      duration: '5 min',
    },
    {
      id: '4',
      title: 'Gratitude',
      description: 'Cultivate feelings of gratitude',
      duration: '3 min',
    },
  ];

  const handlePlayMusic = (playlistId) => {
    // In a real app, this would start playing the music
    setIsPlaying(!isPlaying);
  };

  const startSedonaMethod = () => {
    setShowSedonaDialog(true);
    setCurrentStep(0);
  };

  const nextStep = () => {
    if (currentStep < sedonaSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setShowSedonaDialog(false);
      setCurrentStep(0);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.title}>Music Therapy</Title>
            <Text style={styles.subtitle}>Curated playlists for emotional well-being</Text>
            
            {musicPlaylists.map(playlist => (
              <List.Item
                key={playlist.id}
                title={playlist.title}
                description={`${playlist.description}\n${playlist.duration} • ${playlist.tracks} tracks`}
                left={props => <List.Icon {...props} icon="music" />}
                right={props => (
                  <Button
                    {...props}
                    icon={isPlaying ? "pause" : "play"}
                    onPress={() => handlePlayMusic(playlist.id)}
                  />
                )}
              />
            ))}
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.title}>Sedona Method</Title>
            <Text style={styles.subtitle}>
              A powerful technique for releasing negative emotions and achieving emotional freedom
            </Text>
            <Button
              mode="contained"
              onPress={startSedonaMethod}
              style={styles.startButton}
              icon="play-circle"
            >
              Start Exercise
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>

      <Portal>
        <Dialog visible={showSedonaDialog} onDismiss={() => setShowSedonaDialog(false)}>
          <Dialog.Title>{sedonaSteps[currentStep].title}</Dialog.Title>
          <Dialog.Content>
            <Text style={styles.stepDescription}>{sedonaSteps[currentStep].description}</Text>
            <Text style={styles.stepDuration}>Duration: {sedonaSteps[currentStep].duration}</Text>
            <ProgressBar
              progress={(currentStep + 1) / sedonaSteps.length}
              style={styles.progressBar}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowSedonaDialog(false)}>Exit</Button>
            <Button onPress={nextStep}>
              {currentStep < sedonaSteps.length - 1 ? 'Next Step' : 'Finish'}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  card: {
    margin: 16,
    elevation: 2,
  },
  title: {
    fontSize: 24,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  startButton: {
    marginTop: 16,
  },
  stepDescription: {
    fontSize: 16,
    marginBottom: 8,
  },
  stepDuration: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
});

export default TherapyScreen; 