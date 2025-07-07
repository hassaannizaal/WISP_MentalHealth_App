import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Dimensions } from 'react-native';
import { Card, Title, Text, Button, FAB, ActivityIndicator, SegmentedButtons, TextInput } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '../config';
import { LineChart } from 'react-native-chart-kit';

const MoodTrackerScreen = ({ navigation }) => {
  const [moodEntries, setMoodEntries] = useState([]);
  const [currentMood, setCurrentMood] = useState('neutral');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMoodEntries();
  }, []);

  const fetchMoodEntries = async () => {
    setLoading(true);
    setError('');

    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await axios.get(`${API_URL}/moods`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data && Array.isArray(response.data)) {
        setMoodEntries(response.data);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Error fetching mood entries:', err);
      setError('Failed to load mood entries. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMood = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      await axios.post(`${API_URL}/moods`, {
        mood: currentMood,
        note: note
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Store the last mood entry date
      await AsyncStorage.setItem('lastMoodDate', new Date().toLocaleDateString());
      
      setNote('');
      fetchMoodEntries();
    } catch (err) {
      console.error('Error saving mood:', err);
      setError('Failed to save mood entry');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMoodEntries();
    setRefreshing(false);
  };

  const getMoodEmoji = (mood) => {
    switch (mood) {
      case 'happy': return '😊';
      case 'sad': return '😢';
      case 'angry': return '😠';
      case 'anxious': return '😰';
      case 'neutral': return '😐';
      default: return '😐';
    }
  };

  const getMoodValue = (mood) => {
    switch (mood) {
      case 'happy': return 5;
      case 'neutral': return 3;
      case 'sad': return 1;
      case 'angry': return 2;
      case 'anxious': return 2;
      default: return 3;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const prepareChartData = () => {
    const last7Days = moodEntries.slice(-7);
    return {
      labels: last7Days.map(entry => new Date(entry.logged_at).toLocaleDateString('en-US', { weekday: 'short' })),
      datasets: [{
        data: last7Days.map(entry => getMoodValue(entry.mood))
      }]
    };
  };

  if (loading && moodEntries.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Card style={styles.moodCard}>
          <Card.Content>
            <Title>How are you feeling?</Title>
            <SegmentedButtons
              value={currentMood}
              onValueChange={setCurrentMood}
              buttons={[
                { value: 'happy', label: '😊 Happy' },
                { value: 'neutral', label: '😐 Neutral' },
                { value: 'sad', label: '😢 Sad' },
                { value: 'angry', label: '😠 Angry' },
                { value: 'anxious', label: '😰 Anxious' },
              ]}
              style={styles.moodSelector}
            />
            <TextInput
              label="Notes"
              value={note}
              onChangeText={setNote}
              multiline
              style={styles.input}
              mode="outlined"
            />
            <Button
              mode="contained"
              onPress={handleSaveMood}
              style={styles.saveButton}
            >
              Save Mood
            </Button>
          </Card.Content>
        </Card>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {moodEntries.length > 0 && (
          <Card style={styles.graphCard}>
            <Card.Content>
              <Title>Mood Trends</Title>
              <LineChart
                data={prepareChartData()}
                width={Dimensions.get('window').width - 32}
                height={220}
                chartConfig={{
                  backgroundColor: '#ffffff',
                  backgroundGradientFrom: '#ffffff',
                  backgroundGradientTo: '#ffffff',
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(81, 150, 244, ${opacity})`,
                  style: {
                    borderRadius: 16
                  }
                }}
                bezier
                style={styles.chart}
              />
            </Card.Content>
          </Card>
        )}

        <Title style={styles.historyTitle}>Mood History</Title>
        {moodEntries && moodEntries.map((entry) => (
          <Card key={entry.log_id} style={styles.entryCard}>
            <Card.Content>
              <View style={styles.entryHeader}>
                <Text style={styles.moodEmoji}>{getMoodEmoji(entry.mood)}</Text>
                <Text style={styles.entryDate}>{formatDate(entry.logged_at)}</Text>
              </View>
              {entry.note && (
                <Text style={styles.entryNote}>{entry.note}</Text>
              )}
            </Card.Content>
          </Card>
        ))}
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
  },
  moodCard: {
    margin: 16,
    elevation: 2,
  },
  graphCard: {
    margin: 16,
    marginTop: 0,
    elevation: 2,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  moodSelector: {
    marginVertical: 16,
  },
  input: {
    marginBottom: 16,
  },
  saveButton: {
    marginTop: 8,
  },
  historyTitle: {
    margin: 16,
    marginTop: 8,
  },
  entryCard: {
    margin: 16,
    marginTop: 0,
    elevation: 2,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  moodEmoji: {
    fontSize: 24,
  },
  entryDate: {
    color: '#666',
  },
  entryNote: {
    marginTop: 8,
    color: '#333',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    margin: 16,
  }
});

export default MoodTrackerScreen;