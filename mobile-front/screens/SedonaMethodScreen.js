import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TextInput, Alert, TouchableOpacity } from 'react-native';
import { Button, Text, ProgressBar, Card, Title, Paragraph, IconButton, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';

const SedonaMethodScreen = ({ navigation }) => {
  const [step, setStep] = useState(1);
  const [emotion, setEmotion] = useState('');
  const [allowEmotion, setAllowEmotion] = useState(null);
  const [letGo, setLetGo] = useState(null);
  const [wouldLetGo, setWouldLetGo] = useState(null);
  const [when, setWhen] = useState(null);
  const [reflection, setReflection] = useState('');
  const [showReflection, setShowReflection] = useState(false);

  const totalSteps = 3;

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleComplete = () => {
    setShowReflection(true);
  };

  const handleRestart = () => {
    setStep(1);
    setEmotion('');
    setAllowEmotion(null);
    setLetGo(null);
    setWouldLetGo(null);
    setWhen(null);
    setReflection('');
    setShowReflection(false);
  };

  const handleFinish = () => {
    navigation.goBack();
  };

  const renderStep1 = () => {
    return (
      <View style={styles.stepContainer}>
        <Title style={styles.title}>Step 1: Identify the Emotion</Title>
        <Paragraph style={styles.paragraph}>What are you feeling right now?</Paragraph>
        
        <TextInput
          style={styles.input}
          placeholder="Enter your emotion (e.g., anger, fear, sadness)"
          value={emotion}
          onChangeText={setEmotion}
        />
        
        <Paragraph style={styles.paragraph}>Can you allow yourself to fully feel this emotion?</Paragraph>
        
        <View style={styles.buttonRow}>
          <Button 
            mode={allowEmotion === true ? "contained" : "outlined"} 
            onPress={() => setAllowEmotion(true)}
            style={styles.button}
          >
            Yes
          </Button>
          <Button 
            mode={allowEmotion === false ? "contained" : "outlined"} 
            onPress={() => setAllowEmotion(false)}
            style={styles.button}
          >
            No
          </Button>
        </View>
        
        <Button 
          mode="contained" 
          onPress={handleNext}
          style={styles.nextButton}
          disabled={!emotion || allowEmotion === null}
        >
          Next
        </Button>
      </View>
    );
  };

  const renderStep2 = () => {
    return (
      <View style={styles.stepContainer}>
        <Title style={styles.title}>Step 2: The Sedona Questions</Title>
        
        <Card style={styles.questionCard}>
          <Card.Content>
            <Paragraph style={styles.question}>Could you let this feeling go?</Paragraph>
            <View style={styles.buttonRow}>
              <Button 
                mode={letGo === true ? "contained" : "outlined"} 
                onPress={() => setLetGo(true)}
                style={styles.button}
              >
                Yes
              </Button>
              <Button 
                mode={letGo === false ? "contained" : "outlined"} 
                onPress={() => setLetGo(false)}
                style={styles.button}
              >
                No
              </Button>
            </View>
          </Card.Content>
        </Card>
        
        <Card style={styles.questionCard}>
          <Card.Content>
            <Paragraph style={styles.question}>Would you let it go?</Paragraph>
            <View style={styles.buttonRow}>
              <Button 
                mode={wouldLetGo === true ? "contained" : "outlined"} 
                onPress={() => setWouldLetGo(true)}
                style={styles.button}
              >
                Yes
              </Button>
              <Button 
                mode={wouldLetGo === false ? "contained" : "outlined"} 
                onPress={() => setWouldLetGo(false)}
                style={styles.button}
              >
                No
              </Button>
            </View>
          </Card.Content>
        </Card>
        
        <Card style={styles.questionCard}>
          <Card.Content>
            <Paragraph style={styles.question}>When?</Paragraph>
            <View style={styles.buttonRow}>
              <Button 
                mode={when === 'now' ? "contained" : "outlined"} 
                onPress={() => setWhen('now')}
                style={styles.button}
              >
                Now
              </Button>
              <Button 
                mode={when === 'later' ? "contained" : "outlined"} 
                onPress={() => setWhen('later')}
                style={styles.button}
              >
                Later
              </Button>
              <Button 
                mode={when === 'never' ? "contained" : "outlined"} 
                onPress={() => setWhen('never')}
                style={styles.button}
              >
                Never
              </Button>
            </View>
          </Card.Content>
        </Card>
        
        <View style={styles.navigationButtons}>
          <Button mode="outlined" onPress={handleBack} style={styles.navButton}>
            Back
          </Button>
          <Button mode="contained" onPress={handleComplete} style={styles.navButton}>
            Complete
          </Button>
        </View>
      </View>
    );
  };

  const renderReflection = () => {
    return (
      <View style={styles.stepContainer}>
        <Title style={styles.title}>Reflection</Title>
        <Paragraph style={styles.paragraph}>
          You've completed the Sedona Method. Take a moment to reflect on your experience.
        </Paragraph>
        
        <TextInput
          style={styles.reflectionInput}
          placeholder="Write your reflections here..."
          value={reflection}
          onChangeText={setReflection}
          multiline
          numberOfLines={6}
        />
        
        <View style={styles.affirmationContainer}>
          <Title style={styles.affirmationTitle}>Affirmations</Title>
          <Paragraph style={styles.affirmation}>
            "I release all negative emotions with ease and grace."
          </Paragraph>
          <Paragraph style={styles.affirmation}>
            "I am free from emotional burdens and open to peace."
          </Paragraph>
          <Paragraph style={styles.affirmation}>
            "I choose to let go of what no longer serves me."
          </Paragraph>
          <Paragraph style={styles.affirmation}>
            "I am calm, centered, and emotionally balanced."
          </Paragraph>
        </View>
        
        <View style={styles.navigationButtons}>
          <Button mode="outlined" onPress={handleRestart} style={styles.navButton}>
            Start Over
          </Button>
          <Button mode="contained" onPress={handleFinish} style={styles.navButton}>
            Finish
          </Button>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Button 
          icon="arrow-left" 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          Back
        </Button>
        <Text style={styles.headerTitle}>Sedona Method</Text>
        <View style={styles.placeholder} />
      </View>
      
      <ProgressBar 
        progress={step / totalSteps} 
        color="#6200ee" 
        style={styles.progressBar} 
      />
      
      <ScrollView style={styles.content}>
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {showReflection && renderReflection()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  backButton: {
    marginRight: 8,
  },
  placeholder: {
    width: 40,
  },
  progressBar: {
    height: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  stepContainer: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    marginBottom: 16,
    textAlign: 'center',
  },
  paragraph: {
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 4,
    padding: 12,
    marginBottom: 24,
    fontSize: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  button: {
    minWidth: 100,
  },
  nextButton: {
    marginTop: 16,
  },
  questionCard: {
    marginBottom: 16,
    elevation: 2,
  },
  question: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  navButton: {
    flex: 1,
    marginHorizontal: 8,
  },
  reflectionInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 4,
    padding: 12,
    marginBottom: 24,
    fontSize: 16,
    height: 150,
    textAlignVertical: 'top',
  },
  affirmationContainer: {
    backgroundColor: '#f0f0f0',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  affirmationTitle: {
    fontSize: 18,
    marginBottom: 12,
    textAlign: 'center',
  },
  affirmation: {
    fontSize: 16,
    marginBottom: 12,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});

export default SedonaMethodScreen; 