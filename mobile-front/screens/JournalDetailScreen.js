import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { TextInput, Button, Title, Text, HelperText, Card, ActivityIndicator, Portal, Modal, Picker } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '../config';

const JournalDetailScreen = ({ route, navigation }) => {
  const { entry } = route.params;
  const [isEditing, setIsEditing] = useState(false);
  const [editedEntry, setEditedEntry] = useState(entry);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
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

  const handleSave = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      await axios.put(
        `${API_URL}/journal/entries/${entry.entry_id}`,
        editedEntry,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setIsEditing(false);
      Alert.alert('Success', 'Journal entry updated successfully');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update journal entry');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this journal entry?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const token = await AsyncStorage.getItem('userToken');
              if (!token) {
                throw new Error('Authentication token not found');
              }

              await axios.delete(
                `${API_URL}/journal/entries/${entry.entry_id}`,
                {
                  headers: {
                    Authorization: `Bearer ${token}`
                  }
                }
              );

              Alert.alert('Success', 'Journal entry deleted successfully');
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to delete journal entry');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
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
            {isEditing ? (
              <>
                <TextInput
                  label="Title"
                  value={editedEntry.title}
                  onChangeText={(text) => setEditedEntry({ ...editedEntry, title: text })}
                  style={styles.input}
                  mode="outlined"
                  theme={{ colors: { primary: '#6200ee' } }}
                />
                <TextInput
                  label="Content"
                  value={editedEntry.content}
                  onChangeText={(text) => setEditedEntry({ ...editedEntry, content: text })}
                  multiline
                  numberOfLines={10}
                  style={[styles.input, styles.contentInput]}
                  mode="outlined"
                  theme={{ colors: { primary: '#6200ee' } }}
                />
                
                <Text style={styles.label}>Category (Optional)</Text>
                <Card style={styles.categoryCard}>
                  <Card.Content>
                    <Picker
                      selectedValue={editedEntry.category_id || ''}
                      onValueChange={value => setEditedEntry({ ...editedEntry, category_id: value })}
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
                
                <TextInput
                  label="Mood"
                  value={editedEntry.mood}
                  onChangeText={(text) => setEditedEntry({ ...editedEntry, mood: text })}
                  style={styles.input}
                  mode="outlined"
                  theme={{ colors: { primary: '#6200ee' } }}
                />
                <View style={styles.buttonContainer}>
                  <Button 
                    mode="contained" 
                    onPress={handleSave} 
                    style={styles.button}
                    loading={loading}
                  >
                    Save Changes
                  </Button>
                  <Button 
                    mode="outlined" 
                    onPress={() => setIsEditing(false)} 
                    style={styles.button}
                  >
                    Cancel
                  </Button>
                </View>
              </>
            ) : (
              <>
                <View style={styles.header}>
                  <Title style={styles.title}>{entry.title}</Title>
                  <Text style={styles.date}>{new Date(entry.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                  })}</Text>
                </View>
                
                {entry.category_name && (
                  <View style={styles.categoryChip}>
                    <Text style={styles.categoryText}>{entry.category_name}</Text>
                  </View>
                )}
                
                <Text style={styles.content}>{entry.content}</Text>
                
                <View style={styles.moodContainer}>
                  <Text style={styles.mood}>
                    Mood: {entry.mood} {getMoodEmoji(entry.mood)}
                  </Text>
                </View>
                
                <View style={styles.actionContainer}>
                  <Button 
                    mode="contained" 
                    onPress={() => setIsEditing(true)}
                    style={styles.actionButton}
                    icon="pencil"
                  >
                    Edit
                  </Button>
                  <Button 
                    mode="outlined" 
                    onPress={handleDelete}
                    style={[styles.actionButton, styles.deleteButton]}
                    icon="delete"
                    textColor="#dc3545"
                  >
                    Delete
                  </Button>
                </View>
              </>
            )}
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
  scrollView: {
    flex: 1,
  },
  card: {
    margin: 16,
    elevation: 2,
    borderRadius: 12,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  date: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  content: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  contentInput: {
    minHeight: 200,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 16,
  },
  button: {
    flex: 1,
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
  deleteButton: {
    borderColor: '#dc3545',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moodContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  mood: {
    fontSize: 16,
    color: '#333',
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
    fontWeight: '500',
  },
  categoryCard: {
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  categoryChip: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  categoryText: {
    color: '#1976d2',
    fontSize: 14,
    fontWeight: '500',
  }
});

export default JournalDetailScreen;