import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Dimensions } from 'react-native';
import { Card, Title, Text, Button, ProgressBar, IconButton, ActivityIndicator, Surface } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '../config';
import Icon from 'react-native-vector-icons/Ionicons';

const WaterRemindersScreen = ({ navigation }) => {
  const [progressData, setProgressData] = useState({
    currentIntakeMl: 0,
    goalMl: 0,
    progressPercent: 0,
  });
  const [dailyLogs, setDailyLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);

  const fetchWaterData = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      // Fetch user profile to get water goal and daily progress
      const [progressResponse, logsResponse, userResponse] = await Promise.all([
        axios.get(`${API_URL}/water/progress`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_URL}/water/logs/today`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_URL}/users/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const { total_intake } = progressResponse.data;
      const currentIntake = parseInt(total_intake) || 0;
      const waterGoal = userResponse.data.water_goal_ml || 3700; // Use user's goal or default to 3700
      const progressPercent = (currentIntake / waterGoal) * 100;
      
      const updatedProgress = {
        currentIntakeMl: currentIntake,
        goalMl: waterGoal,
        progressPercent: progressPercent
      };
      
      setProgressData(updatedProgress);
      setProgress(progressPercent);
      setDailyLogs(Array.isArray(logsResponse.data) ? logsResponse.data : []);
      
      await AsyncStorage.setItem('waterProgress', JSON.stringify(updatedProgress));
    } catch (err) {
      console.error('Error fetching water data:', err.response?.data || err.message);
      setError('Failed to load water data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const handleAddWater = async (amount) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) throw new Error('Authentication token not found');

      const response = await axios.post(
        `${API_URL}/water/logs`,
        { amount_ml: amount },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data && response.data.log) {
        const { log, progress } = response.data;
        const currentIntake = parseInt(progress.currentIntakeMl) || 0;
        const progressPercent = (currentIntake / progress.goalMl) * 100;
        
        setDailyLogs(prevLogs => [log, ...prevLogs]);
        setProgressData({
          currentIntakeMl: currentIntake,
          goalMl: progress.goalMl,
          progressPercent: progressPercent
        });
        setProgress(progressPercent);

        await AsyncStorage.setItem('lastWaterDate', new Date().toLocaleDateString());
      } else {
        throw new Error('Invalid response data');
      }
    } catch (error) {
      console.error('Error adding water:', error);
      setError('Failed to add water intake. Please try again.');
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchWaterData();
  }, [fetchWaterData]);

  useEffect(() => {
    fetchWaterData();
    const interval = setInterval(fetchWaterData, 300000); // 5 minutes
    return () => clearInterval(interval);
  }, [fetchWaterData]);

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return 'Error';
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Card style={styles.card}>
        <Card.Content>
          <Title>Daily Water Progress</Title>
          <Text style={styles.progressText}>
            {progressData.currentIntakeMl}ml / {progressData.goalMl}ml
          </Text>
          <ProgressBar
            progress={progress / 100}
            style={styles.progressBar}
            color={progress >= 100 ? '#4CAF50' : '#2196F3'}
          />
          <Text style={styles.percentageText}>{Math.round(progress)}%</Text>
          
          <View style={styles.buttonContainer}>
            {[250, 500, 1000].map((ml) => (
              <Button
                key={ml}
                mode="contained"
                onPress={() => handleAddWater(ml)}
                style={styles.button}
              >
                +{ml}ml
              </Button>
            ))}
          </View>
        </Card.Content>
      </Card>

      {error ? (
        <Card style={[styles.card, styles.errorCard]}>
          <Card.Content>
            <Text style={styles.errorText}>{error}</Text>
          </Card.Content>
        </Card>
      ) : null}

      <Card style={styles.card}>
        <Card.Content>
          <Title>Today's Entries</Title>
          {dailyLogs.length === 0 ? (
            <Text style={styles.emptyText}>No water logged yet today.</Text>
          ) : (
            dailyLogs.map((entry) => (
              <Surface key={entry.log_id} style={styles.logEntry}>
                <Text style={styles.logAmount}>{entry.amount_ml}ml</Text>
                <Text style={styles.logTime}>{formatTime(entry.logged_at)}</Text>
              </Surface>
            ))
          )}
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    margin: 16,
    elevation: 4,
  },
  errorCard: {
    backgroundColor: '#ffebee',
  },
  errorText: {
    color: '#d32f2f',
  },
  progressText: {
    fontSize: 24,
    textAlign: 'center',
    marginVertical: 16,
  },
  progressBar: {
    height: 16,
    borderRadius: 8,
  },
  percentageText: {
    textAlign: 'center',
    marginTop: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  button: {
    flex: 1,
    marginHorizontal: 4,
  },
  logEntry: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    marginVertical: 4,
    borderRadius: 8,
    elevation: 1,
  },
  logAmount: {
    fontWeight: 'bold',
  },
  logTime: {
    color: '#666',
  },
  emptyText: {
    textAlign: 'center',
    marginVertical: 16,
    color: '#666',
  },
});

export default WaterRemindersScreen;