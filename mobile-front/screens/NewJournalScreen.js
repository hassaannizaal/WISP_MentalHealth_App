import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Animated } from 'react-native';
import { TextInput, Button, Title, Text, SegmentedButtons, Switch, HelperText, Card, Picker } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '../config';

const NewJournalScreen = ({ navigation, route }) => {
  const entryToEdit = route.params?.entry;

  const [title, setTitle] = useState(entryToEdit?.title || '');
  const [content, setContent] = useState(entryToEdit?.content || '');
  const [mood, setMood] = useState(entryToEdit?.mood || 'neutral');
  const [category, setCategory] = useState(entryToEdit?.category_id || '');
  const [categories, setCategories] = useState([]);
  const [isLocked, setIsLocked] = useState(entryToEdit?.is_locked || false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasJournalPassword, setHasJournalPassword] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    checkJournalPassword();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) throw new Error('Token not found');

      const response = await axios.get(`${API_URL}/journal/categories`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCategories(response.data);
    } catch (err) {
      console.error('Error fetching categories:', err);
      // Don't show error to user, categories are optional
    }
  };

  const checkJournalPassword = async () => {
    setHasJournalPassword(false); 
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) throw new Error('Token not found for password check');
      
      await axios.post(`${API_URL}/users/me/journal-password/verify`, 
        { password: `dummy_check_${Date.now()}` }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setHasJournalPassword(true);

    } catch (err) {
      if (err.response) {
        if (err.response.status === 401) {
          setHasJournalPassword(true);
        } else if (err.response.status === 400 && err.response.data?.message === 'Journal password is not set.') {
          setHasJournalPassword(false);
        } else {
          console.warn('[NewJournalScreen] Password check: Received unexpected error:', err.response.status, err.response.data);
          setHasJournalPassword(false);
        }
      } else {
        console.warn('[NewJournalScreen] Password check: Network or other error:', err.message);
        setHasJournalPassword(false);
      }
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title for your journal entry');
      return;
    }

    if (!content.trim()) {
      Alert.alert('Error', 'Please write some content for your journal entry');
      return;
    }

    setLoading(true);
    setError('');

    const entryData = {
      title: title.trim(),
      content: content.trim(),
      mood: mood,
      category_id: category || null,
      is_locked: isLocked,
    };

    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) throw new Error('Authentication token not found');

      let response;
      if (entryToEdit?.entry_id) {
        response = await axios.put(
          `${API_URL}/journal/entries/${entryToEdit.entry_id}`,
          entryData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        response = await axios.post(
          `${API_URL}/journal/entries`,
          entryData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      // Store the last journal entry date
      await AsyncStorage.setItem('lastJournalDate', new Date().toLocaleDateString());

      Alert.alert('Success', `Journal entry ${entryToEdit ? 'updated' : 'saved'} successfully!`);
      navigation.goBack();

    } catch (err) {
      console.error('[NewJournalScreen] Error saving journal entry:', err);
      setError(err.response?.data?.message || 'Failed to save journal entry');
      Alert.alert('Error', err.response?.data?.message || 'Failed to save journal entry');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Animated.ScrollView 
      style={[styles.container, { opacity: fadeAnim }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.content}>
        <Title style={styles.title}>{entryToEdit ? 'Edit Journal Entry' : 'New Journal Entry'}</Title>
        
        {error ? <HelperText type="error" visible={!!error} style={styles.errorText}>{error}</HelperText> : null}
        
        <TextInput
          label="Title"
          value={title}
          onChangeText={setTitle}
          style={styles.input}
          mode="outlined"
          placeholder="Give your entry a meaningful title"
          theme={{ 
            colors: { primary: '#6200ee' },
            roundness: 8
          }}
        />
        
        <TextInput
          label="Content"
          value={content}
          onChangeText={setContent}
          style={styles.contentInput}
          mode="outlined"
          multiline
          numberOfLines={10}
          placeholder="Write your thoughts here..."
          theme={{ 
            colors: { primary: '#6200ee' },
            roundness: 8
          }}
        />

        <Text style={styles.label}>Category (Optional)</Text>
        <Card style={styles.categoryCard}>
          <Card.Content>
            <Picker
              selectedValue={category}
              onValueChange={value => setCategory(value)}
              mode="dropdown"
            >
              <Picker.Item label="Select a category" value="" />
              {categories.map(cat => (
                <Picker.Item 
                  key={cat.category_id} 
                  label={cat.name} 
                  value={cat.category_id}
                />
              ))}
            </Picker>
          </Card.Content>
        </Card>
        
        <Text style={styles.label}>How are you feeling?</Text>
        <View style={styles.moodSelectorContainer}>
          <SegmentedButtons
            value={mood}
            onValueChange={setMood}
            density="medium"
            buttons={[
              { value: 'happy', label: '😊', style: styles.moodButton },
              { value: 'neutral', label: '😐', style: styles.moodButton },
              { value: 'sad', label: '😢', style: styles.moodButton },
              { value: 'angry', label: '😠', style: styles.moodButton },
              { value: 'anxious', label: '😰', style: styles.moodButton },
            ]}
            style={styles.moodSelector}
          />
        </View>

        <Card style={styles.lockCard}>
          <Card.Content>
            <View style={styles.switchContainer}>
              <View>
                <Text style={styles.lockLabel}>Lock this entry?</Text>
                {!hasJournalPassword && 
                  <Text style={styles.lockHint}>Set a journal password in settings to enable locking</Text>
                }
              </View>
              <Switch 
                value={isLocked} 
                onValueChange={value => setIsLocked(value)}
                disabled={!hasJournalPassword && !isLocked}
                color="#6200ee"
              />
            </View>
          </Card.Content>
        </Card>
        
        <View style={styles.buttonContainer}>
          <Button
            mode="outlined"
            onPress={() => navigation.goBack()}
            style={[styles.button, styles.cancelButton]}
            labelStyle={[styles.buttonLabel, styles.cancelButtonLabel]}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            mode="contained"
            onPress={handleSave}
            style={[styles.button, styles.saveButton]}
            labelStyle={styles.buttonLabel}
            loading={loading}
            disabled={loading}
          >
            {entryToEdit ? 'Update Entry' : 'Save Entry'}
          </Button>
        </View>
      </View>
    </Animated.ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
    color: '#1a1a1a',
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  contentInput: {
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    minHeight: 150,
    textAlignVertical: 'top',
  },
  label: {
    fontSize: 18,
    marginBottom: 12,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  moodSelectorContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    elevation: 2,
  },
  moodSelector: {
    marginBottom: 0,
  },
  moodButton: {
    minWidth: 50,
  },
  categoryCard: {
    marginBottom: 24,
    borderRadius: 12,
    elevation: 2,
  },
  lockCard: {
    marginBottom: 24,
    borderRadius: 12,
    elevation: 2,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lockLabel: {
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  lockHint: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 8,
    elevation: 2,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#6200ee',
  },
  cancelButton: {
    borderColor: '#6200ee',
  },
  cancelButtonLabel: {
    color: '#6200ee',
  },
  errorText: {
    color: '#dc3545',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  }
});

export default NewJournalScreen;