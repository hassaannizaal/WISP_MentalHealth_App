import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Linking, Alert } from 'react-native';
import { Card, Title, Text, Button, IconButton, Portal, Modal } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

const EmergencySupportScreen = ({ navigation }) => {
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');

  const loadEmergencyContact = useCallback(async () => {
    console.log("[EmergencySupportScreen] Loading emergency contact data.");
    try {
      const userDataString = await AsyncStorage.getItem('userData');
      if (userDataString) {
        const userData = JSON.parse(userDataString);
        setEmergencyName(userData.emergency_contact_name || '');
        setEmergencyPhone(userData.emergency_contact_phone || '');
        console.log("[EmergencySupportScreen] Loaded EC: ", userData.emergency_contact_name);
      } else {
        setEmergencyName('');
        setEmergencyPhone('');
      }
    } catch (err) {
      console.error('[EmergencySupportScreen] Error loading emergency contact:', err);
      setEmergencyName('');
      setEmergencyPhone('');
    }
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadEmergencyContact();
    });
    return unsubscribe;
  }, [navigation, loadEmergencyContact]);

  const handleEmergencyCall = async (phone) => {
    if (!phone) {
         Alert.alert('Error', 'No phone number provided.');
         return;
    }
    try {
      await Linking.openURL(`tel:${phone}`);
    } catch (err) {
      Alert.alert('Error', 'Could not initiate phone call');
    }
  };

  const handleEmergencyText = (textLineNumber) => {
    Alert.alert(
      'Crisis Text Line',
      `Text HOME to ${textLineNumber} to connect with a crisis counselor.`,
      [
        {
          text: 'Open Messaging App',
          onPress: () => Linking.openURL(`sms:${textLineNumber}`)
        },
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ]
    );
  };

  const handleEmergencyButton = () => {
    setShowEmergencyModal(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Card style={styles.headerCard}>
          <Card.Content style={styles.headerContent}>
             <IconButton icon="lifebuoy" size={40} style={styles.headerIcon} color={styles.headerTitle.color}/>
             <View style={styles.headerTextContainer}>
                <Title style={styles.headerTitle}>Emergency Support</Title>
                <Text style={styles.headerDescription}>
                  If you are in immediate danger or crisis, please use the options below.
                </Text>
            </View>
          </Card.Content>
        </Card>

        <Button
          mode="contained"
          onPress={handleEmergencyButton}
          style={styles.emergencyButton}
          icon="phone-alert"
          labelStyle={styles.emergencyButtonLabel}
        >
          Show Immediate Help Options
        </Button>



      </ScrollView>

      <Portal>
        <Modal
          visible={showEmergencyModal}
          onDismiss={() => setShowEmergencyModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Title style={styles.modalTitle}>Immediate Help</Title>
          <Text style={styles.modalDescription}>
            Connect with support 24/7. Choose an option:
          </Text>
          
          {emergencyName && emergencyPhone ? (
            <Button
                mode="contained"
                onPress={() => handleEmergencyCall(emergencyPhone)} 
                style={[styles.modalButton, styles.personalContactButton]}
                icon="account-alert"
            >
                Call {emergencyName} (Your Contact)
            </Button>
          ) : null}
          
          <Button
            mode="contained"
            onPress={() => handleEmergencyCall('988')} 
            style={styles.modalButton}
            icon="phone"
          >
            Call Crisis Lifeline (988)
          </Button>
          <Button
            mode="contained"
            onPress={() => handleEmergencyText('741741')} 
            style={styles.modalButton}
            icon="message-text"
          >
            Text Crisis Line (741741)
          </Button>
          <Button
            mode="contained"
            onPress={() => handleEmergencyCall('911')} 
            style={[styles.modalButton, styles.emergency911Button]}
            icon="alert-circle"
          >
            Call 911 (Immediate Danger)
          </Button>
          
          <Button
            mode="outlined"
            onPress={() => setShowEmergencyModal(false)}
            style={[styles.modalButton, styles.cancelButton]}
          >
            Cancel
          </Button>
        </Modal>
      </Portal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF0F0',
  },
  scrollContainer: {
    padding: 16,
    alignItems: 'center',
  },
  headerCard: {
    width: '100%',
    marginBottom: 24,
    elevation: 3,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  headerContent: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 15,
  },
  headerIcon: {
      marginRight: 10,
  },
  headerTextContainer: {
      flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#C82333',
    marginBottom: 4,
  },
  headerDescription: {
    fontSize: 15,
    color: '#DC3545',
    lineHeight: 21,
  },
  emergencyButton: {
    width: '90%',
    paddingVertical: 12,
    backgroundColor: '#DC3545',
    borderRadius: 8,
    elevation: 4,
    marginBottom: 24,
  },
  emergencyButtonLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  communityButton: {
    width: '90%',
    paddingVertical: 12,
    backgroundColor: '#4A90E2',
    borderRadius: 8,
    elevation: 4,
    marginBottom: 16,
  },
  communityButtonLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  infoText: {
      fontSize: 16,
      color: '#6C757D',
      textAlign: 'center',
      marginTop: 20,
      paddingHorizontal: 10,
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 25,
    marginHorizontal: 20,
    borderRadius: 12,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#343A40',
    textAlign: 'center',
    marginBottom: 15,
  },
  modalDescription: {
    fontSize: 16,
    color: '#495057',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 22,
  },
  modalButton: {
    marginBottom: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  personalContactButton: {
      backgroundColor: '#17A2B8',
      borderColor: '#17A2B8',
  },
  emergency911Button: {
    backgroundColor: '#C82333',
  },
  cancelButton: {
    marginTop: 5, 
    borderColor: '#6C757D'
  },
});

export default EmergencySupportScreen;