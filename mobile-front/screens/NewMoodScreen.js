import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Card, Title, TextInput, Button, ActivityIndicator, Slider, Text } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '../config';

const NewMoodScreen = ({ navigation }) => {
  const [moodValue, setMoodValue] = useState(5);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const getMoodEmoji = (value) => {
    if (value >= 9) return '😄';
    if (value >= 7) return '🙂';
    if (value >= 5) return '😐';
    if (value >= 3) return '😰';
    return '😢';
  };

  const getMoodColor = (value) => {
    if (value >= 9) return '#4CAF50'; // Green
    if (value >= 7) return '#8BC34A'; // Light Green
    if (value >= 5) return '#FFC107'; // Amber
    if (value >= 3) return '#FF9800'; // Orange
    return '#F44336'; // Red
  };

  const getMoodType = (value) => {
    if (value >= 9) return 'happy';
    if (value >= 7) return 'happy';
    if (value >= 5) return 'neutral';
    if (value >= 3) return 'anxious';
    return 'sad';
  };

  const handleSave = async () => {
    if (!note.trim()) {
      Alert.alert('Error', 'Please add a note about your mood');
      return;
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      await axios.post(`${API_URL}/moods`, {
        mood: getMoodType(moodValue),
        note: note.trim()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Store the current date as last mood entry date
      await AsyncStorage.setItem('lastMoodDate', new Date().toLocaleDateString());
      
      Alert.alert('Success', 'Mood entry saved successfully');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to save mood entry');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.title}>How are you feeling?</Title>
            
            <View style={styles.moodContainer}>
              <Text style={styles.moodEmoji}>{getMoodEmoji(moodValue)}</Text>
              <Text style={styles.moodValue}>{moodValue}/10</Text>
            </View>
            
            <Slider
              value={moodValue}
              onValueChange={setMoodValue}
              minimumValue={1}
              maximumValue={10}
              step={1}
              minimumTrackTintColor={getMoodColor(moodValue)}
              maximumTrackTintColor="#E0E0E0"
              thumbTintColor={getMoodColor(moodValue)}
              style={styles.slider}
            />
            
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderLabel}>😢</Text>
              <Text style={styles.sliderLabel}>😐</Text>
              <Text style={styles.sliderLabel}>😄</Text>
            </View>
            
            <TextInput
              label="How are you feeling? (Add a note)"
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={4}
              style={styles.input}
              mode="outlined"
            />
            
            <View style={styles.buttonContainer}>
              <Button 
                mode="contained" 
                onPress={handleSave} 
                style={styles.button}
                disabled={loading}
              >
                Save Mood
              </Button>
              <Button 
                mode="outlined" 
                onPress={() => navigation.goBack()} 
                style={styles.button}
                disabled={loading}
              >
                Cancel
              </Button>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    </View>
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
    marginBottom: 24,
    textAlign: 'center',
  },
  moodContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  moodEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  moodValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  slider: {
    width: '100%',
    height: 40,
    marginBottom: 8,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    marginBottom: 24,
  },
  sliderLabel: {
    fontSize: 20,
  },
  input: {
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  button: {
    flex: 1,
    marginHorizontal: 8,
  },
});

export default NewMoodScreen;