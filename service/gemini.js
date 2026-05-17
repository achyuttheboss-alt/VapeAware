import axios from "axios";
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY;
const BASE_URL = "https://api.groq.com/openai/v1/chat/completions";

const SYSTEM_INSTRUCTION = `
You are VapeGuardian, a chatbot that ONLY answers questions about vaping, vaping devices, quitting vaping, vaping health effects, and vaping laws. You are to provide citations for the sources you used to formulate your response within the response you give the user. Make sure to include these citations at the end of the response.
If a user asks something unrelated to vaping, reply with exactly:
"I can only answer vaping-related questions."
`;

function isGreeting(input) {
  const greetings = ["hi", "hello", "hey", "yo", "greetings"];
  return greetings.some((g) => input.toLowerCase().trim() === g);
}

function isVapeRelated(input) {
  const vapeKeywords = [
    "vape",
    "vaping",
    "e-cig",
    "nicotine",
    "pod",
    "health",
    "flavor",
    "quit",
  ];
  return vapeKeywords.some((kw) => input.toLowerCase().includes(kw));
}

const RATE_LIMIT_KEY = 'chat_rate_limit';
const MAX_MESSAGES_PER_HOUR = 10;
const ONE_HOUR_IN_MS = 60 * 60 * 1000;

async function checkRateLimit() {
  try {
    const data = await AsyncStorage.getItem(RATE_LIMIT_KEY);
    let timestamps = data ? JSON.parse(data) : [];

    const now = Date.now();
    // Filter timestamps to only keep those within the last hour
    timestamps = timestamps.filter(t => now - t < ONE_HOUR_IN_MS);

    if (timestamps.length >= MAX_MESSAGES_PER_HOUR) {
      return false; // Limit exceeded
    }

    // Add new timestamp and save
    timestamps.push(now);
    await AsyncStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(timestamps));
    return true;
  } catch (error) {
    console.error("Rate limit error:", error);
    // On error, let the message pass so we don't break the app
    return true;
  }
}

export async function sendMessageToGemini(userMessage) {
  try {
    if (isGreeting(userMessage)) {
      return "Hello! I'm VapeGuardian. Ask me anything about vaping, quitting, or health effects.";
    }

    if (!isVapeRelated(userMessage)) {
      return "I can only answer vaping-related questions.";
    }

    const canSend = await checkRateLimit();
    if (!canSend) {
      return "You have reached the limit of 10 messages per hour. Please try again later.";
    }

    const payload = {
      model: "llama-3.3-70b-versatile", // fast free LLaMA 3 model on Groq
      messages: [
        { role: "system", content: SYSTEM_INSTRUCTION },
        { role: "user", content: userMessage }
      ],
      temperature: 0.7,
    };

    const response = await axios.post(BASE_URL, payload, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`
      }
    });

    const reply = response?.data?.choices?.[0]?.message?.content;
    return reply || "No response";
  } catch (error) {
    console.error("Groq API Error:", JSON.stringify(error?.response?.data || error.message, null, 2));
    return `Error: ${error?.response?.data?.error?.message || error.message}`;
  }
}
