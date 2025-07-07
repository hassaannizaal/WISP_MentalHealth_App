import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Card, Title, Text, FAB, Searchbar, ActivityIndicator, Modal, Portal, TextInput, HelperText, Button } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '../config';

const JournalScreen = ({ navigation }) => {
  const [entries, setEntries] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredEntries, setFilteredEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [selectedEntryId, setSelectedEntryId] = useState(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [unlockError, setUnlockError] = useState('');
  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
  const [unlockLoading, setUnlockLoading] = useState(false);

  useEffect(() => {
    fetchJournalEntries();
  }, []);

  useEffect(() => {
    // Filter entries based on search query
    if (searchQuery.trim() === '') {
      setFilteredEntries(entries);
    } else {
      const filtered = entries.filter(entry => 
        entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredEntries(filtered);
    }
  }, [searchQuery, entries]);

  const fetchJournalEntries = async () => {
    setLoading(true);
    setError('');

    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await axios.get(`${API_URL}/journal/entries`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data && Array.isArray(response.data)) {
        setEntries(response.data);
        setFilteredEntries(response.data);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Error fetching journal entries:', err);
      setError('Failed to load journal entries. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchJournalEntries();
    setRefreshing(false);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
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

  const handleEntryPress = (entry) => {
    // --- DEBUG ---
    console.log('[JournalScreen] handleEntryPress triggered. Entry data:', JSON.stringify(entry));
    console.log('[JournalScreen] Checking entry.is_locked:', entry.is_locked, 'Type:', typeof entry.is_locked);
    // --- END DEBUG ---

    if (entry.is_locked === true) { // Explicitly check for boolean true
        console.log('[JournalScreen] Entry is locked, showing modal.'); // Added log
        setSelectedEntryId(entry.entry_id);
        setPasswordInput(''); // Clear previous input
        setUnlockError(''); // Clear previous error
        setIsPasswordModalVisible(true);
    } else {
        // Navigate to detail screen for unlocked entry
        // Pass the full entry data if needed by the detail screen
        console.log('[JournalScreen] Entry is NOT locked, navigating to detail.'); // Added log
        navigation.navigate('JournalDetail', { entry: entry });
    }
  };

  const handleUnlockEntry = async () => {
    setUnlockLoading(true);
    setUnlockError('');

    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await axios.post(`${API_URL}/journal/entries/${selectedEntryId}/unlock`, {
        password: passwordInput
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Check if unlock was successful by looking for the content field
      if (response.data && typeof response.data.content === 'string') {
        // Unlock successful, response.data IS the full entry
        const fullEntry = response.data;
        setIsPasswordModalVisible(false);
        // Navigate with the full entry data received from the unlock endpoint
        navigation.navigate('JournalDetail', { entry: fullEntry });
      } else {
        // Should not happen if status is 200, but handle as failure
        console.warn('Unlock response did not contain expected content:', response.data);
        throw new Error('Failed to unlock entry (invalid response)');
      }
    } catch (err) {
      console.error('Error unlocking entry:', err.response?.data || err.message || err);
      // Check for specific 401 error from backend
      if (err.response?.status === 401) {
          setUnlockError(err.response.data?.message || 'Incorrect journal password.');
      } else {
          // Show generic error for other issues (network, 500, etc.)
          setUnlockError(err.response?.data?.message || 'Failed to unlock entry. Please try again.');
      }
    } finally {
      setUnlockLoading(false);
    }
  };

  const renderJournalEntry = ({ item }) => (
    <Card 
      style={styles.entryCard}
      onPress={() => handleEntryPress(item)}
    >
      <Card.Content>
        <View style={styles.entryHeader}>
          <Title style={styles.entryTitle}>{item.title}</Title>
          <Text style={styles.moodEmoji}>{getMoodEmoji(item.mood)}</Text>
        </View>
        <Text style={styles.entryDate}>{formatDate(item.created_at)}</Text>
        {item.category_name && (
          <View style={styles.categoryContainer}>
            <Text style={styles.categoryText}>{item.category_name}</Text>
          </View>
        )}
        <Text style={styles.entryPreview} numberOfLines={2}>
          {item.is_locked ? '🔒 Content is locked' : item.content}
        </Text>
      </Card.Content>
    </Card>
  );

  if (loading && entries.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading journal entries...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search journal entries"
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
      />
      
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      
      {filteredEntries.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No journal entries found.</Text>
          <Text style={styles.emptySubtext}>
            {searchQuery ? 'Try a different search term.' : 'Create your first entry!'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredEntries}
          renderItem={renderJournalEntry}
          keyExtractor={item => {
              if (item && typeof item.entry_id !== 'undefined' && item.entry_id !== null) {
                return item.entry_id.toString();
              }
              console.warn('Journal entry missing entry_id for key extraction:', item);
              return `fallback-key-${Math.random()}`;
          }}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#007BFF']} tintColor={'#007BFF'}/>
          }
        />
      )}
      
      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => navigation.navigate('NewJournal')}
      />

      {/* Password Input Modal */} 
      <Portal>
        <Modal 
          visible={isPasswordModalVisible} 
          onDismiss={() => setIsPasswordModalVisible(false)} 
          contentContainerStyle={styles.modalContainer}
        >
          <Title style={styles.modalTitle}>Unlock Journal Entry</Title>
          <Text style={styles.modalSubtitle}>This entry is locked for privacy. Please enter your journal password.</Text>
          
          <TextInput
            label="Journal Password"
            value={passwordInput}
            onChangeText={(text) => {
              setPasswordInput(text);
              setUnlockError(''); // Clear error when typing
            }}
            secureTextEntry
            style={styles.modalInput}
            mode="outlined"
            autoFocus={true}
            disabled={unlockLoading}
            returnKeyType="go"
            onSubmitEditing={() => {
              if (passwordInput) handleUnlockEntry();
            }}
            theme={{ 
              colors: { primary: '#6200ee' },
              roundness: 8
            }}
            right={<TextInput.Icon icon="lock" />}
          />

          {unlockError ? (
            <HelperText type="error" visible={!!unlockError} style={styles.modalError}>
              {unlockError}
            </HelperText>
          ) : null}

          <View style={styles.modalButtonContainer}>
            <Button 
              mode="outlined" 
              onPress={() => setIsPasswordModalVisible(false)}
              style={styles.modalButton}
              disabled={unlockLoading}
            >
              Cancel
            </Button>
            <Button 
              mode="contained" 
              onPress={handleUnlockEntry}
              loading={unlockLoading}
              disabled={unlockLoading || !passwordInput}
              style={styles.modalButton}
              icon="unlock"
            >
              Unlock
            </Button>
          </View>
        </Modal>
      </Portal>
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
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  searchBar: {
    margin: 16,
    elevation: 2,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  listContainer: {
    padding: 16,
    paddingTop: 0,
  },
  entryCard: {
    marginBottom: 16,
    elevation: 2,
    borderRadius: 12,
    backgroundColor: '#fff',
    overflow: 'hidden',
    borderLeftWidth: 4,
    borderLeftColor: '#6200ee',
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 8,
  },
  entryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
  },
  moodEmoji: {
    fontSize: 24,
    marginLeft: 8,
  },
  entryDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  entryPreview: {
    fontSize: 14,
    color: '#4a4a4a',
    lineHeight: 20,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#6200ee',
    borderRadius: 28,
    elevation: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    margin: 16,
    marginTop: 0,
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 24,
    margin: 20,
    borderRadius: 12,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 24,
    textAlign: 'center',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 20,
  },
  modalInput: {
    marginBottom: 16,
    backgroundColor: '#f8f9fa',
  },
  modalError: {
    color: '#dc3545',
    textAlign: 'center',
    marginBottom: 16,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
  },
  categoryContainer: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  categoryText: {
    color: '#1976d2',
    fontSize: 12,
    fontWeight: '500',
  },
});

export default JournalScreen;