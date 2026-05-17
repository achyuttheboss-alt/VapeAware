import AsyncStorage from "@react-native-async-storage/async-storage";
import { initializeApp } from "firebase/app";
import { getReactNativePersistence, initializeAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCARAtXy1UhYBIUFJxCzSL71NvPHnX1nTs",
  authDomain: "vapeguardian-be9cb.firebaseapp.com",
  projectId: "vapeguardian-be9cb",
  storageBucket: "vapeguardian-be9cb.appspot.com",
  messagingSenderId: "642703825083",
  appId: "1:642703825083:web:3fcba2c92aa860ab91f19e",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});
