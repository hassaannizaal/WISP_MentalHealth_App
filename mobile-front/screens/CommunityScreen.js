import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, FlatList, ScrollView, RefreshControl, KeyboardAvoidingView, Platform } from 'react-native';
import { Card, Title, Text, Avatar, Surface, Button, ActivityIndicator, TextInput, IconButton, Menu, Portal, Dialog, FAB, SegmentedButtons } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '../config';
import Icon from 'react-native-vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';

const CommunityScreen = () => {
  // View Management
  const [view, setView] = useState('topics');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Topics State
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [selectedTopicName, setSelectedTopicName] = useState('');

  // Threads State
  const [threads, setThreads] = useState([]);
  const [selectedThread, setSelectedThread] = useState(null);
  const [threadPage, setThreadPage] = useState(1);
  const [hasMoreThreads, setHasMoreThreads] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // New Thread State
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [guidelinesVisible, setGuidelinesVisible] = useState(false);

  // Comments State
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [submittingComment, setSubmittingComment] = useState(false);

  // Menu State
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedComment, setSelectedComment] = useState(null);
  const [reportDialogVisible, setReportDialogVisible] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportType, setReportType] = useState(null);
  const [reportId, setReportId] = useState(null);

  const flatListRef = useRef(null);

  useEffect(() => {
    if (view === 'topics') {
      fetchTopics();
    }
  }, [view]);

  const fetchTopics = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const [topicsResponse, countsResponse] = await Promise.all([
        axios.get(`${API_URL}/community/topics`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/community/topic-thread-counts`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const threadCountMap = countsResponse.data.reduce((acc, item) => {
        acc[item.topic_id] = item.thread_count;
        return acc;
      }, {});

      const topicsWithCounts = topicsResponse.data.map(topic => ({
        ...topic,
        thread_count: threadCountMap[topic.topic_id] || 0
      }));

      setTopics(topicsWithCounts);
      setError('');
    } catch (err) {
      setError('Failed to load topics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchThreads = async (topicId, page = 1, append = false) => {
    if (loadingMore) return;
    setLoadingMore(append);
    
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await axios.get(`${API_URL}/community/topics/${topicId}/threads`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { page, limit: 20 }
      });

      const newThreads = response.data;
      setHasMoreThreads(newThreads.length === 20);
      setThreads(append ? [...threads, ...newThreads] : newThreads);
      setError('');
    } catch (err) {
      setError('Failed to load threads');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const fetchThreadDetails = async (threadId) => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const [threadResponse, commentsResponse] = await Promise.all([
        axios.get(`${API_URL}/community/threads/${threadId}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/community/threads/${threadId}/comments`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setSelectedThread(threadResponse.data);
      setComments(commentsResponse.data);
      setError('');
    } catch (err) {
      setError('Failed to load thread details');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateThread = async () => {
    if (!newTitle.trim() || !newContent.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await axios.post(
        `${API_URL}/community/topics/${selectedTopic}/threads`,
        {
          title: newTitle.trim(),
          content: newContent.trim()
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setNewTitle('');
      setNewContent('');
      setView('threads');
      fetchThreads(selectedTopic);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create thread');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateComment = async () => {
    if (!newComment.trim() || submittingComment) return;

    setSubmittingComment(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      await axios.post(
        `${API_URL}/community/threads/${selectedThread.thread_id}/comments`,
        {
          content: newComment.trim(),
          parent_comment_id: replyTo?.comment_id
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setNewComment('');
      setReplyTo(null);
      fetchThreadDetails(selectedThread.thread_id);
    } catch (err) {
      setError('Failed to post comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleLikeThread = async (threadId) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      await axios.post(
        `${API_URL}/community/threads/${threadId}/like`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (view === 'threads') {
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
      } else if (view === 'threadDetail' && selectedThread?.thread_id === threadId) {
        setSelectedThread(prev => ({
          ...prev,
          like_count: prev.user_liked ? prev.like_count - 1 : prev.like_count + 1,
          user_liked: !prev.user_liked
        }));
      }
    } catch (err) {
      setError('Failed to like thread');
    }
  };

  const handleLikeComment = async (commentId) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      await axios.post(
        `${API_URL}/community/comments/${commentId}/like`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setComments(comments.map(comment => {
        if (comment.comment_id === commentId) {
          return {
            ...comment,
            like_count: comment.user_liked ? comment.like_count - 1 : comment.like_count + 1,
            user_liked: !comment.user_liked
          };
        }
        return comment;
      }));
    } catch (err) {
      setError('Failed to like comment');
    }
  };

  const handleReport = async () => {
    if (!reportReason.trim()) return;

    try {
      const token = await AsyncStorage.getItem('userToken');
      await axios.post(
        `${API_URL}/community/reports`,
        {
          threadId: reportType === 'thread' ? reportId : null,
          commentId: reportType === 'comment' ? reportId : null,
          reason: reportReason.trim()
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setReportDialogVisible(false);
      setReportReason('');
      setReportType(null);
      setReportId(null);
    } catch (err) {
      setError('Failed to submit report');
    }
  };

  const renderTopicList = () => (
    <View style={styles.container}>
      <Surface style={styles.header}>
        <Title style={styles.headerTitle}>Community Topics</Title>
      </Surface>

      <FlatList
        data={topics}
        renderItem={({ item }) => (
          <Card 
            style={styles.topicCard}
            onPress={() => {
              setSelectedTopic(item.topic_id);
              setSelectedTopicName(item.name);
              setView('threads');
              fetchThreads(item.topic_id);
            }}
          >
            <Card.Content>
              <View style={styles.topicHeader}>
                <Title style={styles.topicTitle}>{item.name}</Title>
                <Icon name="chevron-forward" size={24} color="#666" />
              </View>
              <Text style={styles.topicDescription}>{item.description}</Text>
              <View style={styles.topicStats}>
                <Text style={styles.statText}>
                  <Icon name="chatbubble-outline" size={14} color="#666" /> {item.thread_count} threads
                </Text>
              </View>
            </Card.Content>
          </Card>
        )}
        keyExtractor={item => item.topic_id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={fetchTopics} />
        }
        contentContainerStyle={styles.listContainer}
      />

      <FAB
        style={styles.fab}
        icon="plus"
        label="New Thread"
        onPress={() => {
          setView('newThread');
          setGuidelinesVisible(true);
        }}
      />
    </View>
  );

  const renderThreadList = () => (
    <View style={styles.container}>
      <Surface style={styles.header}>
        <View style={styles.headerContent}>
          <IconButton
            icon="arrow-left"
            size={24}
            onPress={() => {
              setView('topics');
              setSelectedTopic(null);
              setSelectedTopicName('');
            }}
          />
          <View style={styles.headerTextContainer}>
            <Title style={styles.headerTitle}>{selectedTopicName}</Title>
            <Text style={styles.headerSubtitle}>{threads.length} threads</Text>
          </View>
          <IconButton
            icon="plus"
            size={24}
            onPress={() => {
              setView('newThread');
              setGuidelinesVisible(true);
            }}
          />
        </View>
      </Surface>

      <FlatList
        data={threads}
        renderItem={({ item }) => (
          <Card 
            style={styles.threadCard}
            onPress={() => {
              setSelectedThread(item);
              setView('threadDetail');
              fetchThreadDetails(item.thread_id);
            }}
          >
            <Card.Content>
              <View style={styles.threadHeader}>
                <View style={styles.userInfo}>
                  <Avatar.Text size={24} label={item.username?.[0]?.toUpperCase() || '?'} />
                  <Text style={styles.username}>{item.username}</Text>
                </View>
              </View>
              <Title style={styles.threadTitle}>{item.title}</Title>
              <Text numberOfLines={2} style={styles.threadContent}>{item.content}</Text>
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
        )}
        keyExtractor={item => item.thread_id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchThreads(selectedTopic)} />
        }
        onEndReached={() => {
          if (hasMoreThreads && !loadingMore) {
            const nextPage = threadPage + 1;
            setThreadPage(nextPage);
            fetchThreads(selectedTopic, nextPage, true);
          }
        }}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loadingMore ? <ActivityIndicator style={styles.footerLoader} /> : null
        }
      />
    </View>
  );

  const renderThreadDetail = () => (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : null}
    >
      <Surface style={styles.header}>
        <View style={styles.headerContent}>
          <IconButton
            icon="arrow-left"
            size={24}
            onPress={() => {
              setView('threads');
              setSelectedThread(null);
              setComments([]);
            }}
          />
          <Title style={styles.headerTitle}>Thread</Title>
          <IconButton
            icon="dots-vertical"
            size={24}
            onPress={() => {
              setReportType('thread');
              setReportId(selectedThread.thread_id);
              setReportDialogVisible(true);
            }}
          />
        </View>
      </Surface>

      <FlatList
        ref={flatListRef}
        data={comments}
        ListHeaderComponent={() => (
          <Card style={styles.threadCard}>
            <Card.Content>
              <View style={styles.threadHeader}>
                <View style={styles.userInfo}>
                  <Avatar.Text size={32} label={selectedThread?.username?.[0]?.toUpperCase() || '?'} />
                  <Text style={styles.username}>{selectedThread?.username}</Text>
                </View>
              </View>
              <Title style={styles.threadTitle}>{selectedThread?.title}</Title>
              <Text style={styles.threadContent}>{selectedThread?.content}</Text>
              <View style={styles.threadStats}>
                <View style={styles.stat}>
                  <Icon name="chatbubble-outline" size={16} color="#666" />
                  <Text style={styles.statText}>{comments.length} comments</Text>
                </View>
                <View style={styles.stat}>
                  <IconButton
                    icon={selectedThread?.user_liked ? "heart" : "heart-outline"}
                    iconColor={selectedThread?.user_liked ? "#B00020" : "#666"}
                    size={16}
                    onPress={() => handleLikeThread(selectedThread.thread_id)}
                  />
                  <Text style={styles.statText}>{selectedThread?.like_count} likes</Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        )}
        renderItem={({ item }) => (
          <Card style={[styles.commentCard, { marginLeft: item.level * 32 }]}>
            <Card.Content>
              <View style={styles.commentHeader}>
                <View style={styles.userInfo}>
                  <Avatar.Text size={24} label={item.username?.[0]?.toUpperCase() || '?'} />
                  <Text style={styles.username}>{item.username}</Text>
                </View>
                {!item.deleted_at && (
                  <Menu
                    visible={menuVisible && selectedComment?.comment_id === item.comment_id}
                    onDismiss={() => {
                      setMenuVisible(false);
                      setSelectedComment(null);
                    }}
                    anchor={
                      <IconButton
                        icon="dots-vertical"
                        size={20}
                        onPress={() => {
                          setSelectedComment(item);
                          setMenuVisible(true);
                        }}
                      />
                    }
                  >
                    <Menu.Item
                      onPress={() => {
                        setReplyTo(item);
                        setMenuVisible(false);
                      }}
                      title="Reply"
                    />
                    <Menu.Item
                      onPress={() => {
                        setReportType('comment');
                        setReportId(item.comment_id);
                        setReportDialogVisible(true);
                        setMenuVisible(false);
                      }}
                      title="Report"
                    />
                  </Menu>
                )}
              </View>
              <Text style={[styles.commentContent, item.deleted_at && styles.deletedComment]}>
                {item.deleted_at ? '[Comment deleted]' : item.content}
              </Text>
              {!item.deleted_at && (
                <View style={styles.commentActions}>
                  <IconButton
                    icon={item.user_liked ? "heart" : "heart-outline"}
                    iconColor={item.user_liked ? "#B00020" : "#666"}
                    size={16}
                    onPress={() => handleLikeComment(item.comment_id)}
                  />
                  <Text style={styles.likeCount}>{item.like_count}</Text>
                </View>
              )}
            </Card.Content>
          </Card>
        )}
        keyExtractor={item => item.comment_id.toString()}
        contentContainerStyle={styles.listContainer}
      />

      <Surface style={styles.commentInputContainer}>
        {replyTo && (
          <View style={styles.replyingTo}>
            <Text style={styles.replyingToText}>
              Replying to {replyTo.username}
            </Text>
            <IconButton
              icon="close"
              size={16}
              onPress={() => setReplyTo(null)}
            />
          </View>
        )}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.commentInput}
            placeholder="Write a comment..."
            value={newComment}
            onChangeText={setNewComment}
            multiline
            mode="outlined"
          />
          <IconButton
            icon="send"
            size={24}
            onPress={handleCreateComment}
            disabled={!newComment.trim() || submittingComment}
            loading={submittingComment}
          />
        </View>
      </Surface>

      <Portal>
        <Dialog visible={reportDialogVisible} onDismiss={() => setReportDialogVisible(false)}>
          <Dialog.Title>Report {reportType === 'thread' ? 'Thread' : 'Comment'}</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Reason for reporting"
              value={reportReason}
              onChangeText={setReportReason}
              multiline
              numberOfLines={3}
              mode="outlined"
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setReportDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleReport} disabled={!reportReason.trim()}>Submit</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </KeyboardAvoidingView>
  );

  const renderNewThread = () => (
    <View style={styles.container}>
      <Surface style={styles.header}>
        <View style={styles.headerContent}>
          <IconButton
            icon="arrow-left"
            size={24}
            onPress={() => {
              setView(selectedTopic ? 'threads' : 'topics');
              setNewTitle('');
              setNewContent('');
            }}
          />
          <Title style={styles.headerTitle}>Create New Thread</Title>
        </View>
      </Surface>

      <ScrollView style={styles.scrollView}>
        <View style={styles.form}>
          {!selectedTopic && (
            <>
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
            </>
          )}

          <TextInput
            label="Title"
            value={newTitle}
            onChangeText={setNewTitle}
            mode="outlined"
            style={styles.input}
            placeholder="Write a descriptive title"
          />

          <TextInput
            label="Content"
            value={newContent}
            onChangeText={setNewContent}
            mode="outlined"
            multiline
            numberOfLines={8}
            style={styles.contentInput}
            placeholder="Share your thoughts, experiences, or questions..."
          />

          <Button
            mode="contained"
            onPress={handleCreateThread}
            style={styles.submitButton}
            loading={loading}
            disabled={loading || !newTitle.trim() || !newContent.trim() || !selectedTopic}
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
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#6200ee" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {error ? (
        <Surface style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Button onPress={() => {
            setError('');
            if (view === 'topics') fetchTopics();
            else if (view === 'threads') fetchThreads(selectedTopic);
            else if (view === 'threadDetail') fetchThreadDetails(selectedThread.thread_id);
          }}>
            Try Again
          </Button>
        </Surface>
      ) : (
        <>
          {view === 'topics' && renderTopicList()}
          {view === 'threads' && renderThreadList()}
          {view === 'threadDetail' && renderThreadDetail()}
          {view === 'newThread' && renderNewThread()}
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
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
    padding: 16,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  scrollView: {
    flex: 1,
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
  listContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  topicCard: {
    marginBottom: 12,
    elevation: 2,
  },
  topicHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topicTitle: {
    fontSize: 20,
  },
  topicDescription: {
    color: '#666',
    marginTop: 8,
    marginBottom: 12,
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
  threadTitle: {
    fontSize: 18,
    marginBottom: 8,
  },
  threadContent: {
    marginBottom: 12,
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
  commentCard: {
    marginBottom: 8,
    elevation: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  commentContent: {
    fontSize: 14,
    lineHeight: 20,
  },
  deletedComment: {
    color: '#999',
    fontStyle: 'italic',
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  likeCount: {
    color: '#666',
  },
  commentInputContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  replyingTo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  replyingToText: {
    fontSize: 12,
    color: '#666',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentInput: {
    flex: 1,
    marginRight: 8,
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
  guidelineText: {
    lineHeight: 24,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  footerLoader: {
    marginVertical: 16,
  },
});

export default CommunityScreen;