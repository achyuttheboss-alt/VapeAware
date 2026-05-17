import { useRouter } from "expo-router";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import React, { useState } from "react";
import { Alert, Button, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { auth, db } from '../../firebase/firebaseConfig';

const validStates = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL",
  "IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT",
  "NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI",
  "SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"
];

const validGrades = ["1","2","3","4","5","6","7","8","9", "10", "11", "12"];

export default function Signup() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [state, setState] = useState("");
  const [grade, setGrade] = useState("");

  const handleSignup = async () => {
    if (password !== confirmPassword) {
      Alert.alert("Passwords do not match");
      return;
    }

    if (!state || !grade) {
      Alert.alert("Please enter your state and grade");
      return;
    }

    if (!validStates.includes(state.toUpperCase())) {
      Alert.alert("Please enter a valid U.S. state (two-letter code, e.g., NY)");
      return;
    }

    if (!validGrades.includes(grade)) {
      Alert.alert("Grade must be 9, 10, 11, or 12");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;
      await setDoc(doc(db, "users", uid), {
        email,
        state: state.toUpperCase(),
        grade,
        createdAt: new Date().toISOString(),
      });
      Alert.alert("Signup successful!");
      router.push("/survey");
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Sign Up</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#A57C5C"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#A57C5C"
        value={password}
        secureTextEntry
        onChangeText={setPassword}
      />

      <TextInput
        style={styles.input}
        placeholder="Confirm Password"
        placeholderTextColor="#A57C5C"
        value={confirmPassword}
        secureTextEntry
        onChangeText={setConfirmPassword}
      />

      <TextInput
        style={styles.input}
        placeholder="State (e.g., NY)"
        placeholderTextColor="#A57C5C"
        value={state}
        onChangeText={setState}
        autoCapitalize="characters"
      />

      <TextInput
        style={styles.input}
        placeholder="Grade(Enter a number please) "
        placeholderTextColor="#A57C5C"
        value={grade}
        onChangeText={setGrade}
        keyboardType="numeric"
      />

      <View style={styles.buttonWrapper}>
        <Button title="Sign Up" onPress={handleSignup} color="#6B4226" />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: "center", padding: 20, backgroundColor: "#FAF7F0" },
  title: { fontSize: 26, fontWeight: "bold", marginBottom: 25, textAlign: "center", color: "#6B4226", fontFamily: "Space Mono" },
  input: { borderWidth: 1, borderColor: "#E4DCCF", padding: 10, marginBottom: 15, borderRadius: 8, color: "#6B4226", backgroundColor: "#F7F4EA", fontFamily: "Space Mono" },
  buttonWrapper: { marginTop: 10, borderRadius: 8, overflow: "hidden" },
});
