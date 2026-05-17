import { Link } from "expo-router";
import React, { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";
import { Button, Text, TextInput } from "react-native-paper";
import { useAuth } from "../context/AuthContext";

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      await signIn(email, password);
    } catch (error: any) {
      let errorMessage = "An error occurred during login";
      
      if (error.code === "auth/invalid-email") errorMessage = "Please enter a valid email address";
      else if (error.code === "auth/user-not-found") errorMessage = "No account found with this email";
      else if (error.code === "auth/wrong-password") errorMessage = "Incorrect password";
      else if (error.code === "auth/too-many-requests") errorMessage = "Too many failed attempts. Try later";
      else if (error.message) errorMessage = error.message.replace(/Firebase: Error \(auth\/[^)]+\)\./g, "").trim();

      Alert.alert("Login Failed", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <View style={styles.innerContainer}>
        <Text style={styles.title}>Welcome Back</Text>
        <TextInput
          label="Email"
          mode="outlined"
          keyboardType="email-address"
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          disabled={loading}
        />
        <TextInput
          label="Password"
          mode="outlined"
          secureTextEntry
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          disabled={loading}
        />
        <Button
          mode="contained"
          style={styles.button}
          onPress={handleLogin}
          contentStyle={{ paddingVertical: 8 }}
          loading={loading}
          disabled={loading}
        >
          Login
        </Button>
        <View style={styles.linkContainer}>
          <Text style={{ fontFamily: "SpaceMono-Regular",}}>Don't have an account? </Text>
          <Link href="/signup" asChild>
            <Text style={styles.link}>Sign Up</Text>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAF7F0",
    justifyContent: "center",
  },
  innerContainer: {
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    fontFamily: "SpaceMono-Regular",
    marginBottom: 24,
    alignSelf: "center",
    color: "#6B4226",
  },
  input: {
    marginBottom: 16,
    fontFamily: "SpaceMono-Regular",
    backgroundColor: "#F7F4EA",
    color: "#6B4226",
  },
  button: {
    marginTop: 8,
    borderRadius: 6,
    backgroundColor: "#6B4226",
  },
  linkContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 16,
  },
  link: {
    color: "#8B5E3C",
    fontWeight: "600",
    fontFamily: "SpaceMono-Regular",
  },
});
