import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, KeyboardAvoidingView, Platform } from 'react-native';
import { Card, Title, Text, Avatar, Surface, Button, ActivityIndicator, TextInput, IconButton, Menu, Portal, Dialog } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '../config';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { format } from 'date-fns';

const ThreadDetailScreen = ({ route, navigation }) => {
  const { threadId } = route.params;
  const [thread, setThread] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedComment, setSelectedComment] = useState(null);
  const [reportDialogVisible, setReportDialogVisible] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportType, setReportType] = useState(null);
  const [reportId, setReportId] = useState(null);
  const [submittingComment, setSubmittingComment] = useState(false);
  const flatListRef = useRef(null);

  const fetchThread = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        navigation.navigate('Login');
        return;
      }

      const response = await axios.get(`${API_URL}/community/threads/${threadId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setThread(response.data);
    } catch (error) {
      console.error('Error fetching thread:', error);
      setError('Failed to load thread');
    }
  };

  const fetchComments = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      const response = await axios.get(`${API_URL}/community/threads/${threadId}/comments`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const sortedComments = sortCommentHierarchy(response.data);
      setComments(sortedComments);
    } catch (error) {
      console.error('Error fetching comments:', error);
      setError('Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const sortCommentHierarchy = (commentsArray) => {
    // Create a map for quick lookup
    const commentMap = new Map();
    commentsArray.forEach(comment => {
      commentMap.set(comment.comment_id, { ...comment, replies: [] });
    });

    // Build hierarchy
    const rootComments = [];
    commentsArray.forEach(comment => {
      const commentWithReplies = commentMap.get(comment.comment_id);
      if (comment.parent_comment_id) {
        const parent = commentMap.get(comment.parent_comment_id);
        if (parent) {
          parent.replies.push(commentWithReplies);
        }
      } else {
        rootComments.push(commentWithReplies);
      }
    });

    // Flatten hierarchy with proper order
    const flattenedComments = [];
    const flattenComments = (comment, level = 0) => {
      flattenedComments.push({ ...comment, level });
      comment.replies.forEach(reply => flattenComments(reply, level + 1));
    };
    rootComments.forEach(comment => flattenComments(comment));

    return flattenedComments;
  };

  useEffect(() => {
    Promise.all([fetchThread(), fetchComments()]);
  }, [threadId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchThread(), fetchComments()]);
    setRefreshing(false);
  };

  const handleLikeThread = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        navigation.navigate('Login');
        return;
      }

      await axios.post(`${API_URL}/community/threads/${threadId}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setThread(prev => ({
        ...prev,
        like_count: prev.user_liked ? prev.like_count - 1 : prev.like_count + 1,
        user_liked: !prev.user_liked
      }));
    } catch (error) {
      console.error('Error liking thread:', error);
    }
  };

  const handleLikeComment = async (commentId) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        navigation.navigate('Login');
        return;
      }

      await axios.post(`${API_URL}/community/comments/${commentId}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

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
    } catch (error) {
      console.error('Error liking comment:', error);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim() || submittingComment) return;

    setSubmittingComment(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        navigation.navigate('Login');
        return;
      }

      const response = await axios.post(`${API_URL}/community/threads/${threadId}/comments`, {
        content: newComment.trim(),
        parent_comment_id: replyTo?.comment_id
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const newCommentData = response.data;
      setComments(prevComments => {
        const updatedComments = [...prevComments, { ...newCommentData, level: replyTo ? 1 : 0 }];
        return sortCommentHierarchy(updatedComments);
      });
      setNewComment('');
      setReplyTo(null);

      // Scroll to bottom
      if (flatListRef.current) {
        flatListRef.current.scrollToEnd();
      }
    } catch (error) {
      console.error('Error posting comment:', error);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleReport = async () => {
    if (!reportReason.trim()) return;

    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        navigation.navigate('Login');
        return;
      }

      await axios.post(`${API_URL}/community/reports`, {
        threadId: reportType === 'thread' ? reportId : null,
        commentId: reportType === 'comment' ? reportId : null,
        reason: reportReason.trim()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setReportDialogVisible(false);
      setReportReason('');
      setReportType(null);
      setReportId(null);
    } catch (error) {
      console.error('Error reporting content:', error);
    }
  };

  const openReportDialog = (type, id) => {
    setReportType(type);
    setReportId(id);
    setReportDialogVisible(true);
  };

  const renderComment = ({ item }) => (
    <Card style={[styles.commentCard, { marginLeft: item.level * 32 }]}>
      <Card.Content>
        <View style={styles.commentHeader}>
          <View style={styles.userInfo}>
            <Avatar.Text size={24} label={item.username?.[0]?.toUpperCase() || '?'} />
            <Text style={styles.username}>{item.username}</Text>
            <Text style={styles.dot}>•</Text>
            <Text style={styles.timestamp}>
              {format(new Date(item.created_at), 'MMM d, yyyy')}
            </Text>
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
                  openReportDialog('comment', item.comment_id);
                  setMenuVisible(false);
                }}
                title="Report"
              />
            </Menu>
          )}
        </View>

        <Text style={[
          styles.commentContent,
          item.deleted_at && styles.deletedComment
        ]}>
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
  );

  if (loading && !thread) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200ee" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : null}
      >
        <Surface style={styles.header}>
          <View style={styles.headerContent}>
            <IconButton 
              icon="arrow-left" 
              size={24} 
              onPress={() => navigation.goBack()} 
            />
            <View style={styles.headerTextContainer}>
              <Title style={styles.headerTitle}>Thread</Title>
            </View>
            <IconButton 
              icon="dots-vertical" 
              size={24}
              onPress={() => openReportDialog('thread', threadId)}
            />
          </View>
        </Surface>

        {error ? (
          <Surface style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <Button onPress={onRefresh}>Try Again</Button>
          </Surface>
        ) : (
          <FlatList
            ref={flatListRef}
            data={comments}
            renderItem={renderComment}
            keyExtractor={item => item.comment_id.toString()}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListHeaderComponent={thread && (
              <Card style={styles.threadCard}>
                <Card.Content>
                  <View style={styles.threadHeader}>
                    <View style={styles.userInfo}>
                      <Avatar.Text size={32} label={thread.username?.[0]?.toUpperCase() || '?'} />
                      <Text style={styles.username}>{thread.username}</Text>
                      <Text style={styles.dot}>•</Text>
                      <Text style={styles.timestamp}>
                        {format(new Date(thread.created_at), 'MMM d, yyyy')}
                      </Text>
                    </View>
                  </View>

                  <Title style={styles.threadTitle}>{thread.title}</Title>
                  <Text style={styles.threadContent}>{thread.content}</Text>

                  <View style={styles.threadStats}>
                    <View style={styles.stat}>
                      <Icon name="chatbubble-outline" size={16} color="#666" />
                      <Text style={styles.statText}>{comments.length} comments</Text>
                    </View>
                    <View style={styles.stat}>
                      <IconButton
                        icon={thread.user_liked ? "heart" : "heart-outline"}
                        iconColor={thread.user_liked ? "#B00020" : "#666"}
                        size={16}
                        onPress={handleLikeThread}
                      />
                      <Text style={styles.statText}>{thread.like_count} likes</Text>
                    </View>
                  </View>
                </Card.Content>
              </Card>
            )}
          />
        )}

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
              onPress={handleSubmitComment}
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
  listContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  threadCard: {
    marginBottom: 16,
    elevation: 2,
  },
  threadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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
    fontSize: 20,
    marginBottom: 8,
  },
  threadContent: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  threadStats: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
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
    marginBottom: 12,
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
    marginTop: 8,
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
    backgroundColor: '#fff',
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
});

export default ThreadDetailScreen;