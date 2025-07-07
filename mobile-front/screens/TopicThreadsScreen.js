import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Card, Title, Text, Avatar, Surface, Button, ActivityIndicator, IconButton } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '../config';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { format } from 'date-fns';

const TopicThreadsScreen = ({ route, navigation }) => {
  const { topicId, topicName } = route.params;
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchThreads = async (pageNum = 1, append = false) => {
    if (loadingMore) return;

    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        navigation.navigate('Login');
        return;
      }

      setLoadingMore(append);
      const response = await axios.get(`${API_URL}/community/topics/${topicId}/threads`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { page: pageNum, limit: 20 }
      });

      const newThreads = response.data;
      if (newThreads.length < 20) {
        setHasMore(false);
      }

      setThreads(append ? [...threads, ...newThreads] : newThreads);
      setError('');
    } catch (error) {
      console.error('Error fetching threads:', error);
      setError('Failed to load threads');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchThreads();
  }, [topicId]);

  const onRefresh = async () => {
    setRefreshing(true);
    setPage(1);
    await fetchThreads(1);
    setRefreshing(false);
  };

  const loadMore = () => {
    if (hasMore && !loading && !loadingMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchThreads(nextPage, true);
    }
  };

  const handleLikeThread = async (threadId) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        navigation.navigate('Login');
        return;
      }

      await axios.post(`${API_URL}/community/threads/${threadId}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update threads state to reflect the like
      setThreads(threads.map(thread => {
        if (thread.thread_id === threadId) {
          return {
            ...thread,
            like_count: thread.user_liked ? thread.like_count - 1 : thread.like_count + 1,
            user_liked: !thread.user_liked
          };
        }
        return thread;
      }));
    } catch (error) {
      console.error('Error liking thread:', error);
    }
  };

  const renderThread = ({ item }) => (
    <Card 
      style={styles.threadCard}
      onPress={() => navigation.navigate('ThreadDetail', { threadId: item.thread_id })}
    >
      <Card.Content>
        <View style={styles.threadHeader}>
          <View style={styles.userInfo}>
            <Avatar.Text size={24} label={item.username?.[0]?.toUpperCase() || '?'} />
            <Text style={styles.username}>{item.username}</Text>
            <Text style={styles.dot}>•</Text>
            <Text style={styles.timestamp}>
              {format(new Date(item.created_at), 'MMM d, yyyy')}
            </Text>
          </View>
        </View>

        <Title style={styles.threadTitle}>{item.title}</Title>
        <Text numberOfLines={2}>{item.content}</Text>

        <View style={styles.threadStats}>
          <View style={styles.stat}>
            <Icon name="chatbubble-outline" size={16} color="#666" />
            <Text style={styles.statText}>{item.comment_count || 0} comments</Text>
          </View>
          <View style={styles.stat}>
            <IconButton
              icon={item.user_liked ? "heart" : "heart-outline"}
              iconColor={item.user_liked ? "#B00020" : "#666"}
              size={16}
              onPress={() => handleLikeThread(item.thread_id)}
            />
            <Text style={styles.statText}>{item.like_count} likes</Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  if (loading && !threads.length) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200ee" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Surface style={styles.header}>
        <View style={styles.headerContent}>
          <IconButton 
            icon="arrow-left" 
            size={24} 
            onPress={() => navigation.goBack()} 
          />
          <View style={styles.headerTextContainer}>
            <Title style={styles.headerTitle}>{topicName}</Title>
            <Text style={styles.headerSubtitle}>{threads.length} threads</Text>
          </View>
          <IconButton
            icon="plus"
            size={24}
            onPress={() => navigation.navigate('NewThread', { 
              topicId, 
              topicName,
              fromTopicScreen: true 
            })}
          />
        </View>
      </Surface>

      {error ? (
        <Surface style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Button onPress={() => fetchThreads()}>Try Again</Button>
        </Surface>
      ) : (
        <FlatList
          data={threads}
          renderItem={renderThread}
          keyExtractor={item => item.thread_id.toString()}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator style={styles.footerLoader} />
            ) : null
          }
        />
      )}
    </SafeAreaView>
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
  header: {
    backgroundColor: '#fff',
    elevation: 2,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  headerTextContainer: {
    flex: 1,
    marginLeft: 8,
  },
  headerTitle: {
    fontSize: 20,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  listContainer: {
    padding: 16,
  },
  threadCard: {
    marginBottom: 12,
    elevation: 2,
  },
  threadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  username: {
    marginLeft: 8,
    fontWeight: 'bold',
  },
  dot: {
    marginHorizontal: 4,
    color: '#666',
  },
  timestamp: {
    color: '#666',
  },
  threadTitle: {
    fontSize: 18,
    marginBottom: 8,
  },
  threadStats: {
    flexDirection: 'row',
    marginTop: 8,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  statText: {
    color: '#666',
    marginLeft: 4,
  },
  errorContainer: {
    margin: 16,
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 2,
  },
  errorText: {
    color: '#B00020',
    marginBottom: 12,
  },
  footerLoader: {
    marginVertical: 16,
  },
});

export default TopicThreadsScreen;