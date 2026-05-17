// Imports remain exactly as you provided
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import React, { useState } from 'react';
import { Alert, Linking, SafeAreaView, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Button, Card, Text } from 'react-native-paper';
import surveyData from '../../assets/data/surveyquestions.json';
import { auth, db } from '../../firebase/firebaseConfig';

const surveyQuestions = surveyData.questions;

export default function Survey() {
  const [responses, setResponses] = useState<{ [key: string]: string }>({});
  const [currentKey, setCurrentKey] = useState(surveyQuestions[0].key);
  const [showResults, setShowResults] = useState(false);
  const [riskLevel, setRiskLevel] = useState("");

  const currentQuestion = surveyQuestions.find(q => q.key === currentKey)!;

  const handleSelect = (key: string, value: string, nextId: number | null) => {
    setResponses(prev => ({ ...prev, [key]: value }));
    if (nextId !== null) {
      const nextQuestion = surveyQuestions.find(q => q.id === nextId);
      if (nextQuestion) setCurrentKey(nextQuestion.key);
    } else {
      calculateRisk();
      setShowResults(true);
    }
  };


const handlePrevious = () => {
  const currentIndex = surveyQuestions.findIndex(q => q.key === currentKey);
  const answeredKeys = Object.keys(responses);

  for (let i = currentIndex - 1; i >= 0; i--) {
    if (answeredKeys.includes(surveyQuestions[i].key)) {
      setCurrentKey(surveyQuestions[i].key);
      break;
    }
  }
};

  const calculateRisk = () => {
    const yesCount = Object.values(responses).filter(val => val === "yes").length;
    if (yesCount <= 3) setRiskLevel("Low");
    else if (yesCount <= 6) setRiskLevel("Low-Medium");
    else if (yesCount <= 10) setRiskLevel("Medium-High");
    else setRiskLevel("High");
  };

  const handleSubmitToDB = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      Alert.alert("Error", "No user logged in");
      return;
    }
    try {
      await addDoc(collection(db, "surveyResponses"), {
        responses,
        submittedAt: serverTimestamp(),
        uid
      });
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  const riskColor = (level: string) => {
    switch(level) {
      case "Low": return "#A8E6CF";
      case "Low-Medium": return "#FFD97D";
      case "Medium-High": return "#FFB27D";
      case "High": return "#FF6B6B";
      default: return "#F7F4EA";
    }
  }

  if (showResults) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <Text style={styles.header}>Survey Results</Text>
          <View style={[styles.riskCircle, {backgroundColor: riskColor(riskLevel)}]} />
          <Text style={styles.resultText}>Your risk level: {riskLevel}</Text>

          {riskLevel === "Low" || riskLevel === "Low-Medium" ? (
            <>
              <Text style={styles.linkText} onPress={() => Linking.openURL('https://www.tobaccofreekids.org/protectkids/resources-for-parents/tips-on-talking-to-your-kids')}>
                Tips on Talking to Your Kids
              </Text>
              <Text style={styles.linkDescription}>This website offers helpful strategies for discussing vaping with your child.</Text>
              <Text style={styles.linkText} onPress={() => Linking.openURL('https://www.lung.org/quit-smoking/helping-teens-quit/talk-about-vaping/conversation-guide')}>
                Vaping Conversation Guide
              </Text>
              <Text style={styles.linkDescription}>Provides a structured conversation guide for parents to talk about vaping.</Text>
            </>
          ) : (
            <>
              <Text style={styles.linkText} onPress={() => Linking.openURL('https://nexusteenacademy.com/teen-caught-vaping-what-to-do/')}>
                Teen Caught Vaping – What to Do
              </Text>
              <Text style={styles.linkDescription}>Learn practical steps for addressing teen vaping effectively.</Text>
            </>
          )}

          <Button
            mode="contained"
            onPress={() => { setShowResults(false); setCurrentKey(surveyQuestions[0].key); setResponses({}); }}
            style={styles.navButton}
            labelStyle={styles.navButtonLabel}
          >
            Retake Survey
          </Button>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.header}>Parental Vape Survey</Text>
        <Text style={styles.description}>Please answer the following questions about your child's environment and habits honestly. Please be aware that some potential symptoms of vaping could simply just be adolscence. Please consult our AI Chatbot or other resources for more deinfo</Text>

        <Card style={styles.questionCard} key={currentQuestion.key}>
          <Text style={styles.questionText}>{currentQuestion.question}</Text>
          <View style={styles.radioGroup}>
            {currentQuestion.options.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.radioButton,
                  responses[currentQuestion.key] === opt.value && styles.radioButtonSelected
                ]}
                onPress={() => handleSelect(currentQuestion.key, opt.value, opt.nextId)}
              >
                <Text style={styles.radioText}>{opt.text}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

         <View style={styles.navigationButtons}>
          <Button
            mode="contained"
            onPress={handlePrevious}
            style={styles.navButton}
            labelStyle={styles.navButtonLabel}
          >
            Previous
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAF7F0" },
  scrollContainer: { padding: 20 },
  header: { fontFamily: "SpaceMono-Regular", fontSize: 28, fontWeight: "bold", textAlign: "center", color: "#6B4226", marginBottom: 10 },
  description: { fontFamily: "SpaceMono-Regular", fontSize: 16, textAlign: "center", color: "#8B5E3C", marginBottom: 20 },
  questionCard: { padding: 15, marginBottom: 20, backgroundColor: "#F7F4EA" },
  questionText: { fontFamily: "SpaceMono-Regular", fontSize: 18, color: "#6B4226", marginBottom: 15, textAlign: "center" },
  radioGroup: { flexDirection: "row", justifyContent: "center", marginVertical: 10 },
  radioButton: { 
    borderWidth: 1, 
    borderColor: "#6B4226", 
    borderRadius: 5, 
    paddingVertical: 8, 
    paddingHorizontal: 20, 
    marginHorizontal: 10,
    backgroundColor: "#F7F4EA"
  },
  radioButtonSelected: { 
    backgroundColor: "#E4DCCF" 
  },
  radioText: { fontFamily: "SpaceMono-Regular", color: "#6B4226", fontSize: 16 },
  navigationButtons: { flexDirection: "row", justifyContent: "center", marginTop: 20 },
  navButton: { flex: 1, marginHorizontal: 5, borderRadius: 8, backgroundColor: "#6B4226" },
  navButtonLabel: { fontFamily: "SpaceMono-Regular", fontSize: 16, color: "#F7F4EA" },
  riskCircle: { width: 80, height: 80, borderRadius: 40, alignSelf: "center", marginVertical: 15 },
  resultText: { fontFamily: "SpaceMono-Regular", fontSize: 20, color: "#6B4226", marginBottom: 15, textAlign: "center" },
  linkText: { fontFamily: "SpaceMono-Regular", fontSize: 16, color: "#6B4226", textDecorationLine: "underline", marginBottom: 5, textAlign: "center" },
  linkDescription: { fontFamily: "SpaceMono-Regular", fontSize: 14, color: "#8B5E3C", marginBottom: 10, textAlign: "center" }
});
