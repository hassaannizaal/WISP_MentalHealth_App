import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Linking, Alert } from 'react-native';
import { Card, Title, Text, Button, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import CommunityScreen from './CommunityScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SupportResourcesScreen = ({ navigation }) => {
  const [showCommunity, setShowCommunity] = useState(false);
  
  // Resources from PostgreSQL schema
  const resources = [
    {
      resource_id: 1,
      category: 'Hotlines',
      title: 'Umang Pakistan',
      description: 'Provides anonymous emotional support via trained volunteers in Pakistan.',
      contact_info: '0311-7786264',
      link: 'https://www.instagram.com/umangpakistan'
    },
    {
      resource_id: 2,
      category: 'Therapy',
      title: 'Therapy Works',
      description: 'One of the oldest psychotherapy centers in Pakistan offering counseling and clinical psychology services.',
      contact_info: '+92-21-35870748',
      link: 'https://therapyworks.com.pk'
    },
    {
      resource_id: 3,
      category: 'Crisis Center',
      title: 'Rozan Helpline',
      description: 'Offers psychosocial support, especially for women and children, including trauma counseling.',
      contact_info: '0304-1111744',
      link: 'https://rozan.org'
    },
    {
      resource_id: 4,
      category: 'Therapy',
      title: 'Taskeen Health Initiative',
      description: 'Non-profit mental health initiative offering counseling services and awareness programs.',
      contact_info: 'info@taskeen.org',
      link: 'https://taskeen.org'
    },
    {
      resource_id: 5,
      category: 'Hotlines',
      title: 'PAHCHAAN (Child Abuse & Mental Health)',
      description: 'Provides mental health services with a focus on children and trauma survivors.',
      contact_info: '042-35913944',
      link: 'https://pahchaan.org.pk'
    },
    {
      resource_id: 6,
      category: 'Therapy',
      title: 'Mind Organization',
      description: 'Mental health NGO offering therapy, workshops, and awareness campaigns.',
      contact_info: 'contact@mind.org.pk',
      link: 'https://mind.org.pk'
    },
    {
      resource_id: 7,
      category: 'Crisis Center',
      title: 'Befrienders Karachi',
      description: 'Offers a confidential helpline for people struggling with emotional distress.',
      contact_info: '021-34971882',
      link: 'http://www.befrienderskarachi.org'
    }
  ];

  // Emergency resources (always available)
  const emergencyResources = [
    {
      title: 'Emergency Services',
      description: 'For immediate life-threatening emergencies',
      contact_info: '1122',
      isEmergency: true
    },
    {
      title: 'Police Helpline',
      description: 'For immediate police assistance',
      contact_info: '15',
      isEmergency: true
    },
    {
      title: 'Ambulance Service',
      description: 'For medical emergencies',
      contact_info: '1122',
      isEmergency: true
    }
  ];

  const handleEmergencyPress = () => {
    Alert.alert(
      'Emergency Support',
      'What type of help do you need?',
      [
        {
          text: 'Call Emergency Services (1122)',
          onPress: () => handlePress('1122'),
        },
        {
          text: 'Call Police Helpline (15)',
          onPress: () => handlePress('15'),
        },
        {
          text: 'Contact Personal Emergency Contact',
          onPress: async () => {
            try {
              const userData = await AsyncStorage.getItem('userData');
              if (userData) {
                const { emergency_contact_name, emergency_contact_phone } = JSON.parse(userData);
                if (emergency_contact_phone) {
                  handlePress(emergency_contact_phone);
                } else {
                  Alert.alert(
                    'No Emergency Contact',
                    'Please add an emergency contact in your profile settings.',
                    [
                      {
                        text: 'Go to Profile',
                        onPress: () => navigation.navigate('Profile'),
                      },
                      { text: 'Cancel', style: 'cancel' },
                    ]
                  );
                }
              }
            } catch (error) {
              console.error('Error getting emergency contact:', error);
              Alert.alert('Error', 'Could not retrieve emergency contact information');
            }
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  // Function to handle opening links/phone numbers
  const handlePress = async (urlOrPhone) => {
    let url = urlOrPhone;
    // Basic check if it looks like a phone number to add tel:
    if (/^[\d\s\-+()]+$/.test(urlOrPhone)) {
      url = `tel:${urlOrPhone.replace(/\s+/g, '')}`;
    } 
    // Basic check if it looks like an email to add mailto:
    else if (urlOrPhone.includes('@') && !urlOrPhone.startsWith('mailto:')) {
      url = `mailto:${urlOrPhone}`;
    }
    // Assume website link, ensure it has http(s)://
    else if (!urlOrPhone.startsWith('http://') && !urlOrPhone.startsWith('https://')) {
      url = `https://${urlOrPhone}`;
    }

    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert('Error', `Don't know how to open this: ${url}`);
    }
  };

  if (showCommunity) {
    return <CommunityScreen navigation={navigation} onBack={() => setShowCommunity(false)} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Title style={styles.header}>Support Resources</Title>
        
        {/* Community Support Button */}
        <Button
          mode="contained"
          onPress={() => setShowCommunity(true)}
          style={styles.communityButton}
          icon="account-group"
          labelStyle={styles.communityButtonLabel}
        >
          Connect with Community Support
        </Button>

        {/* Emergency Resources Section */}
        <View style={styles.emergencySection}>
          <Title style={styles.emergencyTitle}>Emergency Resources</Title>
          <Text style={styles.emergencySubtitle}>
            If you're experiencing a mental health emergency, these resources are available 24/7.
          </Text>
          
          {emergencyResources.map((resource) => (
            <Card key={resource.title} style={styles.emergencyCard}>
              <Card.Content>
                <Title style={styles.emergencyResourceTitle}>{resource.title}</Title>
                <Text style={styles.emergencyDescription}>{resource.description}</Text>
                <Button 
                  mode="contained" 
                  onPress={() => handlePress(resource.contact_info)}
                  style={styles.emergencyContactButton}
                  icon="phone"
                >
                  Call {resource.contact_info}
                </Button>
              </Card.Content>
            </Card>
          ))}

          {/* Panic Button */}
          <Button 
            mode="contained" 
            onPress={handleEmergencyPress}
            style={styles.panicButton}
            icon="alert-circle"
            labelStyle={styles.panicButtonLabel}
          >
            I NEED IMMEDIATE HELP
          </Button>
        </View>
        
        {/* Regular Resources Section */}
        <Title style={styles.resourcesTitle}>Mental Health Resources</Title>
        <Text style={styles.resourcesSubtitle}>
          These organizations provide mental health support and counseling services.
        </Text>
        
        {resources.map((resource) => (
          <Card key={resource.resource_id} style={styles.card}>
            <Card.Content>
              <View style={styles.cardHeader}>
                <Title>{resource.title}</Title>
                <Text style={styles.category}>{resource.category}</Text>
              </View>
              
              {resource.description && 
                <Text style={styles.description}>{resource.description}</Text>
              }
              
              <View style={styles.contactContainer}>
                {resource.contact_info && (
                  <View style={styles.contactItem}>
                    <IconButton 
                      icon="phone" 
                      size={20} 
                      onPress={() => handlePress(resource.contact_info)}
                    />
                    <Text style={styles.contact} onPress={() => handlePress(resource.contact_info)}>
                      <Text style={styles.linkText}>{resource.contact_info}</Text>
                    </Text>
                  </View>
                )}
                
                {resource.link && (
                  <View style={styles.contactItem}>
                    <IconButton 
                      icon="web" 
                      size={20} 
                      onPress={() => handlePress(resource.link)}
                    />
                    <Text style={styles.contact} onPress={() => handlePress(resource.link)}>
                      <Text style={styles.linkText}>Visit Website</Text>
                    </Text>
                  </View>
                )}
              </View>
            </Card.Content>
          </Card>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 10,
    color: '#343A40',
    textAlign: 'center',
  },
  communityButton: {
    marginHorizontal: 16,
    marginBottom: 20,
    backgroundColor: '#007BFF',
  },
  communityButtonLabel: {
    color: '#FFFFFF',
  },
  emergencySection: {
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  emergencyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#DC3545',
    marginBottom: 8,
  },
  emergencySubtitle: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 16,
  },
  emergencyCard: {
    marginBottom: 12,
    elevation: 3,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#DC3545',
  },
  emergencyResourceTitle: {
    fontSize: 18,
    color: '#DC3545',
  },
  emergencyDescription: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 12,
  },
  emergencyContactButton: {
    backgroundColor: '#DC3545',
    marginTop: 8,
  },
  panicButton: {
    backgroundColor: '#DC3545',
    marginVertical: 16,
    paddingVertical: 12,
    borderRadius: 8,
    elevation: 4,
  },
  panicButtonLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  resourcesTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 8,
    color: '#343A40',
  },
  resourcesSubtitle: {
    fontSize: 14,
    color: '#495057',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    elevation: 2,
    borderRadius: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  category: {
    fontSize: 12,
    color: '#6C757D',
    backgroundColor: '#E9ECEF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  description: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 12,
    lineHeight: 20,
  },
  contactContainer: {
    marginTop: 8,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  contact: {
    fontSize: 14,
    color: '#212529',
  },
  linkText: {
    color: '#007BFF',
    textDecorationLine: 'underline',
  },
});

export default SupportResourcesScreen;