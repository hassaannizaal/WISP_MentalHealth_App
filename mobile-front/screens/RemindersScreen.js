import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Alert, Platform, RefreshControl } from 'react-native';
import { Card, Title, Text, Button, Switch, List, FAB, Portal, Dialog, TextInput, ActivityIndicator, IconButton } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '../config';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Notifications from 'expo-notifications';

// --- Helper Functions for Notifications --- 
const scheduleNotification = async (reminder) => {
  if (!reminder.enabled) return; // Don't schedule if disabled

  const [hour, minute] = reminder.time.split(':').map(Number);
  const identifier = `reminder-${reminder.id}`;

  try {
    await Notifications.scheduleNotificationAsync({
      identifier: identifier, // Use reminder ID for potential cancellation
      content: {
        title: "Wisp Reminder",
        body: reminder.title,
        sound: 'default', // Use default notification sound
      },
      trigger: {
        hour: hour,
        minute: minute,
        repeats: true, // Make it a daily repeating notification
      },
    });
    console.log(`Scheduled notification for reminder ${reminder.id} at ${reminder.time}`);
  } catch (error) {
     console.error(`Failed to schedule notification for reminder ${reminder.id}:`, error);
  }
};

const cancelNotification = async (reminderId) => {
   const identifier = `reminder-${reminderId}`;
  try {
    await Notifications.cancelScheduledNotificationAsync(identifier);
    console.log(`Cancelled notification for reminder ${reminderId}`);
  } catch (error) {
      console.error(`Failed to cancel notification for reminder ${reminderId}:`, error);
  }
};
// --- End Helper Functions --- 

const RemindersScreen = ({ navigation }) => {
  const [mindfulnessReminders, setMindfulnessReminders] = useState([]);
  const [waterReminders, setWaterReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [reminderType, setReminderType] = useState('mindfulness');
  const [reminderTitle, setReminderTitle] = useState('');
  const [reminderTime, setReminderTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);

  const fetchReminders = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) throw new Error('Authentication token not found');

      const response = await axios.get(`${API_URL}/reminders`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      let fetchedMindfulness = [];
      let fetchedWater = [];

      if (response.data) {
        fetchedMindfulness = response.data.mindfulness || [];
        fetchedWater = response.data.water || [];
        setMindfulnessReminders(fetchedMindfulness);
        setWaterReminders(fetchedWater);

        await Notifications.cancelAllScheduledNotificationsAsync();
        console.log("Cancelled previous notifications.");
        for (const reminder of fetchedMindfulness) {
          await scheduleNotification(reminder);
        }
        for (const reminder of fetchedWater) {
          await scheduleNotification(reminder);
        }
      } else {
        setMindfulnessReminders([]);
        setWaterReminders([]);
        await Notifications.cancelAllScheduledNotificationsAsync();
        throw new Error('Invalid response format from server');
      }
    } catch (err) {
      console.error('Error fetching/scheduling reminders:', err.response?.data || err.message);
      setError('Failed to fetch reminders. Pull down to refresh.');
      setMindfulnessReminders([]);
      setWaterReminders([]);
      await Notifications.cancelAllScheduledNotificationsAsync();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReminders();
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log("Notification received while app foregrounded:", notification);
    });

    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
       console.log("Notification tapped:", response);
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener);
      Notifications.removeNotificationSubscription(responseListener);
    };

  }, [fetchReminders]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchReminders();
    setRefreshing(false);
  }, [fetchReminders]);

  const handleAddReminder = async () => {
    if (!reminderTitle.trim()) {
      Alert.alert('Validation Error', 'Please enter a reminder title');
      return;
    }

    setError(null);
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) throw new Error('Token not found');
      const timeString = reminderTime.toLocaleTimeString('sv-SE');
      
      const newReminderData = {
        type: reminderType,
        title: reminderTitle.trim(),
        time: timeString,
        enabled: true,
      };

      const response = await axios.post(`${API_URL}/reminders`, newReminderData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.status === 201 && response.data) {
          setShowAddDialog(false);
          setReminderTitle('');
          setReminderTime(new Date());
          await scheduleNotification(response.data);
          await fetchReminders();
      } else {
          Alert.alert('Error', 'Could not add reminder. Unexpected server response.');
      }
    } catch (error) {
      console.error('Error adding reminder:', error.response?.data || error.message);
      Alert.alert('Error', 'Failed to add reminder. Please try again.');
    }
  };

  const toggleReminder = async (id, type, currentEnabled) => {
    setError(null);
    const newState = !currentEnabled;
    const optimisticUpdate = (prevState) => 
        prevState.map(r => r.id === id ? { ...r, enabled: newState } : r);
    
    let originalReminders = [];
    if (type === 'mindfulness') {
      originalReminders = [...mindfulnessReminders];
      setMindfulnessReminders(optimisticUpdate);
    } else {
      originalReminders = [...waterReminders];
      setWaterReminders(optimisticUpdate);
    }

    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) throw new Error('Token not found');

      const response = await axios.put(`${API_URL}/reminders/${id}`, 
        { enabled: newState }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const updatedReminder = response.data;
      if (updatedReminder) {
           if (newState) {
             await scheduleNotification(updatedReminder);
          } else {
             await cancelNotification(id);
          }
      } else {
           console.warn("PUT request didn't return updated reminder data.");
           const reminderToUpdate = originalReminders.find(r => r.id === id);
            if(reminderToUpdate) {
                 if (newState) await scheduleNotification({...reminderToUpdate, enabled: true});
                 else await cancelNotification(id);
            } else {
                 await fetchReminders();
            }
      }

    } catch (error) {
        console.error(`Error toggling reminder ${id}:`, error.response?.data || error.message);
        Alert.alert('Error', 'Failed to update reminder status.');
         if (type === 'mindfulness') {
            setMindfulnessReminders(originalReminders);
        } else {
             setWaterReminders(originalReminders);
        }
    }
  };

  const deleteReminder = async (id, type) => {
     Alert.alert(
        "Confirm Deletion",
        "Are you sure you want to delete this reminder?",
        [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete", 
                style: "destructive",
                onPress: async () => {
                    setError(null);
                    const originalState = type === 'mindfulness' ? [...mindfulnessReminders] : [...waterReminders];
                    
                    if (type === 'mindfulness') {
                        setMindfulnessReminders(prev => prev.filter(r => r.id !== id));
                    } else {
                        setWaterReminders(prev => prev.filter(r => r.id !== id));
                    }

                    try {
                        const token = await AsyncStorage.getItem('userToken');
                        if (!token) throw new Error('Token not found');

                        await axios.delete(`${API_URL}/reminders/${id}`, { 
                            headers: { Authorization: `Bearer ${token}` } 
                        });
                        
                        await cancelNotification(id);
                        
                    } catch (error) {
                        console.error(`Error deleting reminder ${id}:`, error.response?.data || error.message);
                        Alert.alert('Error', 'Failed to delete reminder.');
                        if (type === 'mindfulness') {
                            setMindfulnessReminders(originalState);
                        } else {
                            setWaterReminders(originalState);
                        }
                    }
                },
            },
        ]
    );
  };

  const renderReminderItem = (reminder, type) => (
      <List.Item
        key={reminder.id}
        title={reminder.title}
        description={reminder.time.substring(0, 5)}
        left={props => <List.Icon {...props} icon={type === 'water' ? 'water-outline' : 'meditation'} />}
        right={props => (
          <View style={styles.reminderActions}>
            <Switch
              value={reminder.enabled}
              onValueChange={() => toggleReminder(reminder.id, type, reminder.enabled)}
            />
            <IconButton
              icon="delete-outline"
              size={20}
              onPress={() => deleteReminder(reminder.id, type)}
            />
          </View>
        )}
      />
  );

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading && !refreshing && <ActivityIndicator animating={true} size="large" style={styles.loadingIndicator} />}
        {error && <Text style={styles.errorText}>{error}</Text>}
        
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.title}>Mindfulness Reminders</Title>
            {!loading && mindfulnessReminders.length === 0 && <Text style={styles.noItemsText}>No mindfulness reminders set.</Text>}
            {mindfulnessReminders.map(reminder => renderReminderItem(reminder, 'mindfulness'))}
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.title}>Water Reminders</Title>
            {!loading && waterReminders.length === 0 && <Text style={styles.noItemsText}>No water reminders set.</Text>}
            {waterReminders.map(reminder => renderReminderItem(reminder, 'water'))}
          </Card.Content>
        </Card>
      </ScrollView>

      <Portal>
        <Dialog visible={showAddDialog} onDismiss={() => setShowAddDialog(false)}>
          <Dialog.Title>Add New Reminder</Dialog.Title>
          <Dialog.Content>
            <View style={styles.dialogRow}>
              <Button
                mode={reminderType === 'mindfulness' ? 'contained' : 'outlined'}
                onPress={() => setReminderType('mindfulness')}
                style={styles.typeButton}
                labelStyle={styles.typeButtonLabel}
              >
                Mindfulness
              </Button>
              <Button
                mode={reminderType === 'water' ? 'contained' : 'outlined'}
                onPress={() => setReminderType('water')}
                style={styles.typeButton}
                labelStyle={styles.typeButtonLabel}
              >
                Water
              </Button>
            </View>

            <TextInput
              label="Reminder Title"
              value={reminderTitle}
              onChangeText={setReminderTitle}
              mode="outlined"
              style={styles.input}
            />

            <Button
              mode="outlined"
              icon="clock-outline"
              onPress={() => setShowTimePicker(true)}
              style={styles.timeButton}
              labelStyle={styles.timeButtonText}
              contentStyle={{ justifyContent: 'flex-start' }}
            >
              {`Time: ${reminderTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}`}
            </Button>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowAddDialog(false)} labelStyle={styles.dialogButtonLabel}>Cancel</Button>
            <Button onPress={handleAddReminder} labelStyle={styles.dialogButtonLabel}>Add</Button>
          </Dialog.Actions>
        </Dialog>

        {showTimePicker && (
          <DateTimePicker
            value={reminderTime}
            mode="time"
            is24Hour={false}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, selectedTime) => {
              const currentTime = selectedTime || reminderTime;
              setShowTimePicker(Platform.OS === 'ios');
              setReminderTime(currentTime);
            }}
          />
        )}
      </Portal>

      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => setShowAddDialog(true)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollView: {
    flex: 1,
  },
  loadingIndicator: {
      marginTop: 50,
  },
  errorText: {
      color: '#DC3545',
      textAlign: 'center',
      marginVertical: 20,
      paddingHorizontal: 15,
      fontSize: 16,
  },
  card: {
    marginHorizontal: 12,
    marginTop: 16,
    borderRadius: 8,
    elevation: 3,
  },
  title: {
    marginBottom: 4,
    fontWeight: 'bold',
  },
  noItemsText: {
      textAlign: 'center',
      marginVertical: 20,
      fontSize: 16,
      color: '#6C757D',
  },
  reminderActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#6200ee',
  },
  dialogRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: 20,
  },
  typeButton: {
    flex: 1,
    marginHorizontal: 5,
    borderWidth: 1,
  },
   typeButtonLabel: {
      fontSize: 14,
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#FFFFFF'
  },
  timeButton: {
    marginTop: 8,
    paddingVertical: 10,
    borderColor: '#CED4DA',
    borderWidth: 1,
    borderRadius: 4,
    justifyContent: 'center',
  },
  timeButtonText: {
      fontSize: 16,
      textAlign: 'left',
      marginLeft: 10,
  },
  dialogButtonLabel: {
      fontWeight: 'bold',
  },
});

export default RemindersScreen;