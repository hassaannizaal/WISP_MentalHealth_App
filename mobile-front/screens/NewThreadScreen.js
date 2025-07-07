import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { TextInput, Button, Surface, Title, SegmentedButtons, Text, Portal, Dialog, ActivityIndicator, IconButton } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '../config';
import { SafeAreaView } from 'react-native-safe-area-context';

const NewThreadScreen = ({ navigation, route }) => {
  const { topicId: initialTopicId, topicName } = route.params || {};
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedTopic, setSelectedTopic] = useState(initialTopicId || null);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [guidelinesVisible, setGuidelinesVisible] = useState(!initialTopicId);

  useEffect(() => {
    fetchTopics();
  }, []);

  const fetchTopics = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        navigation.navigate('Login');
        return;
      }

      const response = await axios.get(`${API_URL}/community/topics`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setTopics(response.data);
      if (initialTopicId) {
        setSelectedTopic(initialTopicId);
      }
    } catch (error) {
      console.error('Error fetching topics:', error);
      setError('Failed to load topics. Please try again.');
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim() || !selectedTopic) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        navigation.navigate('Login');
        return;
      }

      const response = await axios.post(
        `${API_URL}/community/topics/${selectedTopic}/threads`,
        {
          title: title.trim(),
          content: content.trim()
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const newThread = response.data.thread;
      
      // Navigate back to appropriate screen
      if (route.params?.fromTopicScreen) {
        navigation.navigate('TopicThreads', { 
          topicId: selectedTopic,
          topicName: topics.find(t => t.topic_id === selectedTopic)?.name
        });
      } else {
        navigation.navigate('ThreadDetail', { 
          threadId: newThread.thread_id,
          title: newThread.title
        });
      }
    } catch (error) {
      console.error('Error creating thread:', error);
      setError(error.response?.data?.message || 'Failed to create thread. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Surface style={styles.header}>
          <View style={styles.headerContent}>
            <IconButton
              icon="arrow-left"
              size={24}
              onPress={() => navigation.goBack()}
            />
            <Title style={styles.headerTitle}>Create New Thread</Title>
          </View>
        </Surface>

        {error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : null}

        <View style={styles.form}>
          <Text style={styles.label}>Choose a Topic</Text>
          <SegmentedButtons
            value={selectedTopic}
            onValueChange={setSelectedTopic}
            buttons={topics.map(topic => ({
              value: topic.topic_id,
              label: topic.name,
              style: styles.topicButton,
            }))}
            style={styles.topicButtons}
          />

          <TextInput
            label="Title"
            value={title}
            onChangeText={setTitle}
            mode="outlined"
            style={styles.input}
            placeholder="Write a descriptive title"
          />

          <TextInput
            label="Content"
            value={content}
            onChangeText={setContent}
            mode="outlined"
            multiline
            numberOfLines={8}
            style={styles.contentInput}
            placeholder="Share your thoughts, experiences, or questions..."
          />

          <Button
            mode="contained"
            onPress={handleSubmit}
            style={styles.submitButton}
            loading={loading}
            disabled={loading || !title.trim() || !content.trim() || !selectedTopic}
          >
            {loading ? 'Creating...' : 'Create Thread'}
          </Button>
        </View>
      </ScrollView>

      <Portal>
        <Dialog visible={guidelinesVisible} onDismiss={() => setGuidelinesVisible(false)}>
          <Dialog.Title>Community Guidelines</Dialog.Title>
          <Dialog.Content>
            <Text style={styles.guidelineText}>
              • Be respectful and supportive of others{'\n'}
              • Keep discussions constructive{'\n'}
              • Maintain privacy - don't share personal information{'\n'}
              • Report inappropriate content{'\n'}
              • Consider others' perspectives{'\n'}
              • Stay on topic
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setGuidelinesVisible(false)}>Got it</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#fff',
    elevation: 2,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  headerTitle: {
    fontSize: 20,
    marginLeft: 16,
  },
  form: {
    padding: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#666',
  },
  input: {
    marginBottom: 16,
  },
  contentInput: {
    marginBottom: 16,
    minHeight: 120,
  },
  topicButtons: {
    marginBottom: 16,
  },
  topicButton: {
    flex: 1,
  },
  submitButton: {
    marginTop: 8,
  },
  errorText: {
    color: '#B00020',
    padding: 16,
  },
  guidelineText: {
    lineHeight: 24,
  },
});

export default NewThreadScreen;