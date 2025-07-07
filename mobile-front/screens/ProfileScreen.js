import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Alert, Image, Platform } from 'react-native';
import { Card, Title, TextInput, Button, Avatar, ActivityIndicator, Text, Divider } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '../config';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';

// Helper function to format Date to HH:MM:SS
const formatTimeToHHMMSS = (date) => {
  if (!(date instanceof Date)) return null; // Handle cases where date might not be a Date object
  try {
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const seconds = date.getSeconds().toString().padStart(2, '0');
      return `${hours}:${minutes}:${seconds}`;
  } catch (e) {
      console.error("Error formatting time:", e, date);
      return null; // Return null if formatting fails
  }
};

const ProfileScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showMoodTimePicker, setShowMoodTimePicker] = useState(false);
  const [showMindfulnessTimePicker, setShowMindfulnessTimePicker] = useState(false);

  // Form fields
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState(null);
  const [gender, setGender] = useState('');
  const [bio, setBio] = useState('');
  const [preferredMoodTime, setPreferredMoodTime] = useState(new Date());
  const [hydrationGoal, setHydrationGoal] = useState('2000'); // Default 2L
  const [mindfulnessReminderTime, setMindfulnessReminderTime] = useState(new Date());
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [profileImage, setProfileImage] = useState(null);

  // ---- Journal Password State ----
  const [journalPasswordStatus, setJournalPasswordStatus] = useState('checking'); // 'checking', 'set', 'not_set'
  const [currentJournalPassword, setCurrentJournalPassword] = useState(''); // For verification before remove/change
  const [newJournalPassword, setNewJournalPassword] = useState('');
  const [confirmJournalPassword, setConfirmJournalPassword] = useState('');
  const [journalPasswordSaving, setJournalPasswordSaving] = useState(false);
  const [journalPasswordError, setJournalPasswordError] = useState('');
  // ---- End Journal Password State ----

  // Wrap loadUserData in useCallback
  const loadUserData = useCallback(async () => {
    console.log("[ProfileScreen] loadUserData triggered."); // Add log
    setLoading(true); // Show loading indicator when reloading
    setError(''); // Clear previous errors
    try {
      const userDataString = await AsyncStorage.getItem('userData');
      
      if (userDataString) {
        const userData = JSON.parse(userDataString);
        console.log("[ProfileScreen] Profile image in userData:", 
          userData.profile_image ? `Found (${userData.profile_image.substring(0, 30)}...)` : 'Not found');
        
        // --- DEBUG: Log Parsed Data ---
        console.log("[ProfileScreen] Parsed userData. Keys:", Object.keys(userData));
        console.log("[ProfileScreen] Parsed profile_image length:", userData.profile_image?.length);
        // --- END DEBUG ---
        
        setUser(userData); // Set the base user object
        // --- Set form fields from loaded data ---
        setUsername(userData.username || '');
        setFullName(userData.full_name || userData.fullName || ''); // Handle both snake_case and camelCase keys if needed
        setEmail(userData.email || '');
        setDateOfBirth(userData.date_of_birth ? new Date(userData.date_of_birth) : null);
        setGender(userData.gender || '');
        setBio(userData.bio || '');
        // Careful with Date objects for time - ensure storage/retrieval is consistent
        // Attempt to parse TIME string correctly, defaulting to now if invalid
        let moodTime = new Date();
        if (userData.preferred_mood_time && typeof userData.preferred_mood_time === 'string') {
           const timeParts = userData.preferred_mood_time.split(':');
           if (timeParts.length === 3) {
              moodTime.setHours(parseInt(timeParts[0]), parseInt(timeParts[1]), parseInt(timeParts[2]));
           } else {
             console.warn("Invalid preferred_mood_time format from storage:", userData.preferred_mood_time);
           }
        } else if (userData.preferred_mood_time instanceof Date) {
            moodTime = userData.preferred_mood_time; // Should not happen with JSON stringify/parse
        }
        setPreferredMoodTime(moodTime);
        
        let mindTime = new Date();
        if (userData.mindfulness_reminder_time && typeof userData.mindfulness_reminder_time === 'string') {
           const timeParts = userData.mindfulness_reminder_time.split(':');
           if (timeParts.length === 3) {
              mindTime.setHours(parseInt(timeParts[0]), parseInt(timeParts[1]), parseInt(timeParts[2]));
           } else {
             console.warn("Invalid mindfulness_reminder_time format from storage:", userData.mindfulness_reminder_time);
           }
        } else if (userData.mindfulness_reminder_time instanceof Date) {
             mindTime = userData.mindfulness_reminder_time;
        }
        setMindfulnessReminderTime(mindTime);

        setHydrationGoal(userData.hydration_goal?.toString() || userData.water_goal_ml?.toString() || '2000');
        setEmergencyContactName(userData.emergency_contact_name || '');
        setEmergencyContactPhone(userData.emergency_contact_phone || '');
        if (userData.profile_image && !userData.profile_image.startsWith('data:image')) {
          userData.profile_image = `data:image/jpeg;base64,${userData.profile_image}`;
          console.log("[ProfileScreen] Added data URI prefix to profile image");
        }
        setProfileImage(userData.profile_image);
        console.log("[ProfileScreen] Profile image state set:", 
          userData.profile_image ? "Image data present" : "No image data");
       // console.log("[ProfileScreen] Loaded data. Username:", userData.username, "E.Contact:", userData.emergency_contact_name);
      } else {
         console.log("[ProfileScreen] No userData found in AsyncStorage.");
         // Reset form fields if no data found
         setUser(null);
         setUsername('');
         setFullName('');
         setEmail('');
         setDateOfBirth(null);
         setGender('');
         setBio('');
         setPreferredMoodTime(new Date());
         setHydrationGoal('2000');
         setMindfulnessReminderTime(new Date());
         setEmergencyContactName('');
         setEmergencyContactPhone('');
         setProfileImage(null);
      }
    } catch (error) {
      console.error('[ProfileScreen] Error loading user data:', error);
      setError('Failed to load user data');
      // Reset form fields on error
       setUser(null);
       setUsername('');
       setFullName('');
       setEmail('');
       setDateOfBirth(null);
       setGender('');
       setBio('');
       setPreferredMoodTime(new Date());
       setHydrationGoal('2000');
       setMindfulnessReminderTime(new Date());
       setEmergencyContactName('');
       setEmergencyContactPhone('');
       setProfileImage(null);
    } finally {
      setLoading(false);
    }
  }, []); // Empty dependency array for useCallback

  // Initial mount effect 
  useEffect(() => {
    // loadUserData(); // Remove initial call - handled by focus listener
    checkJournalPasswordStatus(); // Keep initial journal password check
  }, []); // Keep empty array for one-time effect

  // Add focus listener to reload data
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      console.log("[ProfileScreen] Focus detected, reloading user data.");
      loadUserData();
      // Optionally re-check journal password status too
      // checkJournalPasswordStatus(); 
    });
    // Return the function to unsubscribe
    return unsubscribe;
  }, [navigation, loadUserData]); // Add dependencies

  const handleUpdate = async () => {
    try {
      setSaving(true);
      setError('');
      
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      // Strip the data URI prefix if present for smaller payload
      let processedImage = profileImage;
      if (profileImage && profileImage.startsWith('data:image')) {
        processedImage = profileImage.split(',')[1];
      }

      const updatedData = {
        username: username.trim() || null,
        full_name: fullName.trim() || null,
        email: email.trim() || null,
        date_of_birth: dateOfBirth ? dateOfBirth.toISOString().split('T')[0] : null,
        gender: gender || null,
        bio: bio.trim() || null,
        preferred_mood_time: formatTimeToHHMMSS(preferredMoodTime),
        water_goal_ml: parseInt(hydrationGoal) || 2000,
        mindfulness_reminder_time: formatTimeToHHMMSS(mindfulnessReminderTime),
        emergency_contact_name: emergencyContactName.trim() || null,
        emergency_contact_phone: emergencyContactPhone.trim() || null,
        profile_image: processedImage
      };

      const response = await axios.put(`${API_URL}/users/me`, updatedData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data) {
        // Add back the data URI prefix for local storage if it was a base64 image
        if (response.data.profile_image && !response.data.profile_image.startsWith('data:image')) {
          response.data.profile_image = `data:image/jpeg;base64,${response.data.profile_image}`;
        }
        await AsyncStorage.setItem('userData', JSON.stringify(response.data));
        setUser(response.data);
        setIsEditing(false);
        Alert.alert('Success', 'Profile updated successfully');
      }
    } catch (error) {
      console.error('[ProfileScreen] Error updating profile:', error.response?.data || error.message || error);
      setError(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userData');
      navigation.reset({
        index: 0,
        routes: [{ name: 'Welcome' }],
      });
    } catch (error) {
      console.error('Error logging out:', error);
      setError('Failed to log out');
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.3,
        base64: true,
        exif: false,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        // Add data:image/jpeg;base64, prefix if not present
        const base64Data = result.assets[0].base64;
        const finalImageData = base64Data.startsWith('data:image') 
          ? base64Data 
          : `data:image/jpeg;base64,${base64Data}`;
        setProfileImage(finalImageData);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDateOfBirth(selectedDate);
    }
  };

  const onMoodTimeChange = (event, selectedTime) => {
    setShowMoodTimePicker(false);
    if (selectedTime) {
      setPreferredMoodTime(selectedTime);
    }
  };

  const onMindfulnessTimeChange = (event, selectedTime) => {
    setShowMindfulnessTimePicker(false);
    if (selectedTime) {
      setMindfulnessReminderTime(selectedTime);
    }
  };

  // ---- Journal Password Functions ----
  const checkJournalPasswordStatus = async () => {
    setJournalPasswordStatus('checking');
    setJournalPasswordError('');
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) throw new Error('Token not found');
      // Use the verify endpoint - success/401 means set, 400 means not set
      await axios.post(`${API_URL}/users/me/journal-password/verify`, 
        { password: 'dummy_check_' + Date.now() }, // Send dummy data
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setJournalPasswordStatus('set'); // Succeeds or 401 means it's set
    } catch (err) {
      if (err.response?.status === 400 && err.response?.data?.message === 'Journal password is not set.') {
        setJournalPasswordStatus('not_set');
      } else if (err.response?.status === 401) {
        // Incorrect password response also means a password IS set
        setJournalPasswordStatus('set');
      } else {
        console.warn('Could not verify journal password status:', err.response?.data || err.message);
        setJournalPasswordError('Could not check journal password status.');
        setJournalPasswordStatus('unknown'); // Indicate an error occurred
      }
    }
  };

  const handleSetJournalPassword = async () => {
    setJournalPasswordError('');
    if (newJournalPassword !== confirmJournalPassword) {
      setJournalPasswordError('New passwords do not match.');
      return;
    }
    if (newJournalPassword.length < 6) {
       setJournalPasswordError('Journal password must be at least 6 characters long.');
       return;
    }

    setJournalPasswordSaving(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) throw new Error('Token not found');

      const payload = { password: newJournalPassword };
      // --- DEBUG --- 
      console.log('[ProfileScreen] Attempting to set journal password. Payload:', payload);
      // --- END DEBUG ---

      await axios.put(`${API_URL}/users/me/journal-password`, 
        payload, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // --- DEBUG --- 
      console.log('[ProfileScreen] Journal password API call successful.');
      // --- END DEBUG ---

      setNewJournalPassword('');
      setConfirmJournalPassword('');
      setCurrentJournalPassword(''); // Clear current field too
      setJournalPasswordStatus('set');
      Alert.alert('Success', 'Journal password updated successfully.');

    } catch (err) {
      // --- DEBUG --- 
      console.error('[ProfileScreen] Error setting journal password:', err.response?.data || err.message);
      // --- END DEBUG ---
      setJournalPasswordError(err.response?.data?.message || 'Failed to set journal password.');
    } finally {
      setJournalPasswordSaving(false);
    }
  };

  const handleRemoveJournalPassword = async () => {
    setJournalPasswordError('');
    // Optional: Require current password verification before removal
    if (!currentJournalPassword) {
      setJournalPasswordError('Please enter your current journal password to remove it.');
      return;
    }

    setJournalPasswordSaving(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) throw new Error('Token not found');

      // Step 1: Verify current password
      await axios.post(`${API_URL}/users/me/journal-password/verify`, 
        { password: currentJournalPassword }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Step 2: If verification passes, remove the password
      await axios.delete(`${API_URL}/users/me/journal-password`, 
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setCurrentJournalPassword('');
      setNewJournalPassword('');
      setConfirmJournalPassword('');
      setJournalPasswordStatus('not_set');
      Alert.alert('Success', 'Journal password removed successfully.');

    } catch (err) {
      console.error('Error removing journal password:', err.response?.data || err.message);
      if (err.response?.status === 401) {
          setJournalPasswordError('Incorrect current journal password.');
      } else {
          setJournalPasswordError(err.response?.data?.message || 'Failed to remove journal password.');
      }
    } finally {
      setJournalPasswordSaving(false);
    }
  };
  // ---- End Journal Password Functions ----

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.header}>
            {profileImage ? (
              <Avatar.Image
                size={80}
                source={{ uri: profileImage }}
                style={styles.avatar}
              />
            ) : (
              <Avatar.Text
                size={80}
                label={(username || fullName || 'U').substring(0, 2).toUpperCase()}
                style={styles.avatar}
              />
            )}
            {isEditing && (
              <Button mode="outlined" onPress={pickImage} style={styles.changePhotoButton}>
                Change Photo
              </Button>
            )}
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Title style={styles.sectionTitle}>Profile Information</Title>
          <View style={styles.form}>
            <TextInput
              label="Username (optional)"
              value={username}
              onChangeText={setUsername}
              disabled={!isEditing}
              style={styles.input}
              mode="outlined"
            />

            <TextInput
              label="Full Name"
              value={fullName}
              onChangeText={setFullName}
              disabled={!isEditing}
              style={styles.input}
              mode="outlined"
            />

            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              disabled={!isEditing}
              style={styles.input}
              mode="outlined"
              keyboardType="email-address"
            />

            <Button
              mode="outlined"
              onPress={() => setShowDatePicker(true)}
              style={styles.input}
              disabled={!isEditing}
            >
              {dateOfBirth ? dateOfBirth.toLocaleDateString() : 'Select Date of Birth (optional)'}
            </Button>

            <TextInput
              label="Gender (optional)"
              value={gender}
              onChangeText={setGender}
              disabled={!isEditing}
              style={styles.input}
              mode="outlined"
            />

            <TextInput
              label="Bio (optional)"
              value={bio}
              onChangeText={setBio}
              disabled={!isEditing}
              style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]}
              mode="outlined"
              multiline
            />

            <Button
              mode="outlined"
              onPress={() => setShowMoodTimePicker(true)}
              style={styles.input}
              disabled={!isEditing}
            >
              Preferred Mood Check Time: {preferredMoodTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Button>

            <TextInput
              label="Daily Hydration Goal (mL)"
              value={hydrationGoal}
              onChangeText={setHydrationGoal}
              disabled={!isEditing}
              style={styles.input}
              mode="outlined"
              keyboardType="numeric"
            />

            <Button
              mode="outlined"
              onPress={() => setShowMindfulnessTimePicker(true)}
              style={styles.input}
              disabled={!isEditing}
            >
              Mindfulness Reminder Time: {mindfulnessReminderTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Button>

            <Title style={styles.sectionTitle}>Emergency Contact (Optional)</Title>
            <TextInput
              label="Contact Name"
              value={emergencyContactName}
              onChangeText={setEmergencyContactName}
              disabled={!isEditing}
              style={styles.input}
              mode="outlined"
              placeholder="e.g., Jane Doe"
            />
            <TextInput
              label="Contact Phone Number"
              value={emergencyContactPhone}
              onChangeText={setEmergencyContactPhone}
              disabled={!isEditing}
              style={styles.input}
              mode="outlined"
              keyboardType="phone-pad"
              placeholder="e.g., +1 555-123-4567"
            />
          </View>

          <View style={styles.buttonRow}>
            {!isEditing ? (
              <Button mode="contained" onPress={() => setIsEditing(true)} style={styles.button}>
                Edit Profile
              </Button>
            ) : (
              <>
                <Button mode="outlined" onPress={() => {setIsEditing(false); loadUserData();}} style={styles.button} disabled={saving}>
                  Cancel
                </Button>
                <Button mode="contained" onPress={handleUpdate} style={styles.button} loading={saving} disabled={saving}>
                  Save Profile
                </Button>
              </>
            )}
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Journal Security</Title>

          {journalPasswordError ? <Text style={styles.errorText}>{journalPasswordError}</Text> : null}

          {journalPasswordStatus === 'checking' && <ActivityIndicator style={styles.statusIndicator} />}
          {journalPasswordStatus === 'unknown' && <Text style={styles.statusText}>Error checking status.</Text>}
          {journalPasswordStatus === 'set' && <Text style={styles.statusText}>Journal password is currently set.</Text>}
          {journalPasswordStatus === 'not_set' && <Text style={styles.statusText}>Journal password is not set.</Text>}

          {journalPasswordStatus === 'set' && (
            <TextInput
              label="Current Journal Password"
              value={currentJournalPassword}
              onChangeText={setCurrentJournalPassword}
              secureTextEntry
              style={styles.input}
              placeholder="Enter current password to change/remove"
              mode="outlined"
              disabled={journalPasswordSaving}
            />
          )}

          <TextInput
            label="New Journal Password"
            value={newJournalPassword}
            onChangeText={setNewJournalPassword}
            secureTextEntry
            style={styles.input}
            placeholder={journalPasswordStatus === 'set' ? "Enter new password (optional)" : "Enter password (min 6 chars)"}
            mode="outlined"
            disabled={journalPasswordSaving}
          />
          <TextInput
            label="Confirm New Journal Password"
            value={confirmJournalPassword}
            onChangeText={setConfirmJournalPassword}
            secureTextEntry
            style={styles.input}
            placeholder="Confirm new password"
            mode="outlined"
            disabled={journalPasswordSaving}
          />

          <View style={styles.buttonRow}>
             <Button 
                mode="contained" 
                onPress={handleSetJournalPassword}
                disabled={journalPasswordSaving || !newJournalPassword || !confirmJournalPassword || (journalPasswordStatus === 'set' && !currentJournalPassword)}
                loading={journalPasswordSaving && !!newJournalPassword}
                style={styles.button}
             >
                {journalPasswordStatus === 'set' ? 'Update Password' : 'Set Password'}
             </Button>
             {journalPasswordStatus === 'set' && (
                <Button 
                    mode="outlined" 
                    color="#DC3545"
                    onPress={handleRemoveJournalPassword}
                    disabled={journalPasswordSaving || !currentJournalPassword}
                    loading={journalPasswordSaving && !newJournalPassword}
                    style={[styles.button, styles.removeButton]}
                >
                    Remove Password
                </Button>
             )}
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
           <Button mode="contained" color="#6C757D" onPress={handleLogout} style={styles.logoutButton}>
            Logout
           </Button>
        </Card.Content>
      </Card>

      {showDatePicker && Platform.OS === 'android' && (
          <DateTimePicker
            value={dateOfBirth || new Date()}
            mode="date"
            display="default"
            onChange={onDateChange}
          />
        )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
    elevation: 2,
    borderRadius: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    marginBottom: 10,
  },
   changePhotoButton: {
        marginTop: 5,
   },
   sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#343A40',
  },
  form: {
    marginTop: 16,
  },
  input: {
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  button: {
    flex: 1,
    marginHorizontal: 4,
  },
  removeButton: {
    borderColor: '#DC3545',
  },
  statusIndicator: {
    marginVertical: 10,
  },
  statusText: {
    textAlign: 'center',
    marginVertical: 10,
    fontStyle: 'italic',
    color: '#495057'
  },
  errorText: {
    color: '#DC3545',
    textAlign: 'center',
    marginBottom: 10,
    fontSize: 14,
  },
  logoutButton: {
      marginVertical: 10,
  },
});

export default ProfileScreen;