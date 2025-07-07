import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Card, Title, Text, Button, Switch, TextInput, FAB, ActivityIndicator } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '../config';

const MindfulnessRemindersScreen = ({ navigation }) => {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [newReminder, setNewReminder] = useState({
    title: '',
    time: '09:00',
    enabled: true
  });

  useEffect(() => {
    fetchReminders();
  }, []);

  const fetchReminders = async () => {
    setLoading(true);
    setError('');

    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await axios.get(`${API_URL}/reminders`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data && response.data.mindfulness) {
        setReminders(response.data.mindfulness);
      } else {
        setReminders([]);
      }
    } catch (err) {
      console.error('Error fetching reminders:', err);
      setError('Failed to load reminders');
    } finally {
      setLoading(false);
    }
  };

  const handleAddReminder = async () => {
    if (!newReminder.title.trim()) {
      setError('Please enter a reminder title');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await axios.post(
        `${API_URL}/reminders`,
        {
          ...newReminder,
          type: 'mindfulness'
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data) {
        setReminders([...reminders, response.data]);
        setNewReminder({
          title: '',
          time: '09:00',
          enabled: true
        });
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Error adding reminder:', err);
      setError('Failed to add reminder');
    }
  };

  const handleToggleReminder = async (id, enabled) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await axios.put(
        `${API_URL}/reminders/${id}`,
        { enabled },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data) {
        setReminders(reminders.map(reminder =>
          reminder.id === id ? { ...reminder, enabled } : reminder
        ));
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Error updating reminder:', err);
      setError('Failed to update reminder');
    }
  };

  const handleDeleteReminder = async (id) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      await axios.delete(`${API_URL}/reminders/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setReminders(reminders.filter(reminder => reminder.id !== id));
    } catch (err) {
      console.error('Error deleting reminder:', err);
      setError('Failed to delete reminder');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchReminders();
    setRefreshing(false);
  };

  if (loading && reminders.length === 0) {
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
        <Card style={styles.addCard}>
          <Card.Content>
            <Title>Add New Reminder</Title>
            <TextInput
              label="Reminder Title"
              value={newReminder.title}
              onChangeText={(text) => setNewReminder({ ...newReminder, title: text })}
              style={styles.input}
              mode="outlined"
            />
            <TextInput
              label="Time (HH:MM)"
              value={newReminder.time}
              onChangeText={(text) => setNewReminder({ ...newReminder, time: text })}
              style={styles.input}
              mode="outlined"
            />
            <View style={styles.switchContainer}>
              <Text>Enabled</Text>
              <Switch
                value={newReminder.enabled}
                onValueChange={(value) => setNewReminder({ ...newReminder, enabled: value })}
              />
            </View>
            <Button
              mode="contained"
              onPress={handleAddReminder}
              style={styles.addButton}
            >
              Add Reminder
            </Button>
          </Card.Content>
        </Card>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Title style={styles.remindersTitle}>Your Reminders</Title>
        {reminders.map((reminder) => (
          <Card key={reminder.id} style={styles.reminderCard}>
            <Card.Content>
              <View style={styles.reminderHeader}>
                <View style={styles.reminderInfo}>
                  <Title style={styles.reminderTitle}>{reminder.title}</Title>
                  <Text style={styles.reminderTime}>{reminder.time}</Text>
                </View>
                <Switch
                  value={reminder.enabled}
                  onValueChange={(value) => handleToggleReminder(reminder.id, value)}
                />
              </View>
              <Button
                mode="outlined"
                onPress={() => handleDeleteReminder(reminder.id)}
                style={styles.deleteButton}
                textColor="red"
              >
                Delete
              </Button>
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
  addCard: {
    margin: 16,
    elevation: 2,
  },
  input: {
    marginBottom: 16,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addButton: {
    marginTop: 8,
  },
  remindersTitle: {
    margin: 16,
    marginTop: 8,
  },
  reminderCard: {
    margin: 16,
    marginTop: 0,
    elevation: 2,
  },
  reminderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  reminderInfo: {
    flex: 1,
  },
  reminderTitle: {
    fontSize: 18,
  },
  reminderTime: {
    color: '#666',
  },
  deleteButton: {
    marginTop: 8,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    margin: 16,
  }
});

export default MindfulnessRemindersScreen;