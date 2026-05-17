import { format } from "date-fns";
import { useRouter } from "expo-router";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { LineChart } from "react-native-chart-kit";
import { Button, Card, Text } from "react-native-paper";
import { auth, db } from "../../firebase/firebaseConfig";

export default function ViewSurvey() {
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState([]);
  const [selectedResult, setSelectedResult] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchSurveyResults = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          setLoading(false);
          return;
        }

        const q = query(
          collection(db, "surveyResults"),
          where("userId", "==", user.uid),
          orderBy("createdAt", "desc")
        );

        const querySnapshot = await getDocs(q);
        const surveyResults = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          surveyResults.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
          });
        });

        setResults(surveyResults);
      } catch (error) {
        console.error("Error fetching survey results:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSurveyResults();
  }, []);

  const getRiskColor = (risk) => {
    const riskColors = {
      None: "#4CAF50",
      "Low-Medium": "#8BC34A",
      Medium: "#FF9800",
      "Medium-High": "#FF5722",
      High: "#F44336",
    };
    return riskColors[risk] || "#9E9E9E";
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#6B4226" />
      </SafeAreaView>
    );
  }

  if (!results || results.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.messageContainer}>
          <Text style={styles.noResultText}>No survey results found.</Text>
          <Button
            mode="contained"
            onPress={() => router.push("/(tabs)/survey")}
            style={[styles.button, { backgroundColor: "#6B4226" }]}
            contentStyle={{ height: 48 }}
            labelStyle={{ color: "#F7F4EA" }}
          >
            Take Survey
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  const renderSurveyItem = ({ item, index }) => (
    <TouchableOpacity onPress={() => setSelectedResult(item)} style={styles.surveyItem}>
      <Card style={styles.resultCard}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <Text style={styles.surveyNumber}>Survey #{results.length - index}</Text>
            <Text style={styles.date}>
              {item.createdAt ? format(item.createdAt, "MMM dd, yyyy") : "N/A"}
            </Text>
          </View>

          <View style={styles.riskContainer}>
            <View style={[styles.riskBadge, { backgroundColor: getRiskColor(item.risk) }]}>
              <Text style={styles.riskBadgeText}>{item.risk || "Unknown"}</Text>
            </View>
            <Text style={styles.yesCount}>{item.yesCount} Yes answers</Text>
          </View>

          <Text style={styles.messagePreview} numberOfLines={2}>
            {item.message || "No message available"}
          </Text>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  if (selectedResult) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.detailContainer}>
          <View style={styles.detailHeader}>
            <Button
              mode="text"
              onPress={() => setSelectedResult(null)}
              style={styles.backButton}
              labelStyle={{ color: "#6B4226" }}
            >
              ← Back to List
            </Button>
          </View>

          <Text style={styles.title}>Survey Details</Text>

          <Card style={styles.detailCard}>
            <Card.Content>
              <Text style={styles.date}>
                Submitted on:{" "}
                {selectedResult.createdAt ? format(selectedResult.createdAt, "PPpp") : "N/A"}
              </Text>

              <View style={[styles.riskMeter, { backgroundColor: getRiskColor(selectedResult.risk) }]}>
                <Text style={styles.riskText}>{selectedResult.risk}</Text>
              </View>

              <Text style={styles.detail}>You answered "Yes" to {selectedResult.yesCount} questions.</Text>
              <Text style={styles.riskMessage}>{selectedResult.message}</Text>
            </Card.Content>
          </Card>

          <Button
            mode="contained"
            onPress={() => router.push("/(tabs)/survey")}
            style={[styles.button, { backgroundColor: "#6B4226" }]}
            contentStyle={{ height: 48 }}
            labelStyle={{ color: "#F7F4EA" }}
          >
            Take New Survey
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  // Build chart data so oldest survey is on the left
  const sortedOldestFirst = [...results].slice().reverse(); // copy + reverse so oldest -> newest
  const trendLabels = sortedOldestFirst.map((r, i) => `S${i + 1}`); // S1 = oldest
  const trendData = {
    labels: trendLabels,
    datasets: [
      {
        data: sortedOldestFirst.map((r) => (typeof r.yesCount === "number" ? r.yesCount : 0)),
      },
    ],
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.listContainer}>
        <Text style={styles.title}>Survey History</Text>
        <Text style={styles.subtitle}>Total Surveys: {results.length}</Text>

        <Card style={styles.graphCard}>
          <Card.Content>
            <Text style={styles.subtitle}>Trend of "Yes" Answers Over Time</Text>
            <LineChart
              data={trendData}
              width={Dimensions.get("window").width - 32}
              height={220}
              chartConfig={{
                backgroundGradientFrom: "#FAF7F0",
                backgroundGradientTo: "#FAF7F0",
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(107,66,38,${opacity})`,
                labelColor: (opacity = 1) => `rgba(107,66,38,${opacity})`,
                style: { borderRadius: 12 },
                propsForDots: { r: "5", strokeWidth: "2", stroke: "#E4DCCF" },
              }}
              bezier
              style={{ marginVertical: 12, borderRadius: 12 }}
            />
          </Card.Content>
        </Card>

        <FlatList
          data={results}
          renderItem={renderSurveyItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />

        <Button
          mode="contained"
          onPress={() => router.push("/(tabs)/survey")}
          style={[styles.floatingButton, { backgroundColor: "#6B4226" }]}
          contentStyle={{ height: 48 }}
          labelStyle={{ color: "#F7F4EA" }}
        >
          Take New Survey
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAF7F0", // primary_bg
  },
  listContainer: {
    flex: 1,
    padding: 16,
  },
  detailContainer: {
    flex: 1,
    padding: 16,
  },
  detailHeader: {
    marginBottom: 16,
  },
  backButton: {
    alignSelf: "flex-start",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: "#6B4226", // text_primary
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 16,
    color: "#8B5E3C", // text_secondary
  },
  surveyItem: {
    marginBottom: 12,
  },
  resultCard: {
    borderRadius: 12,
    elevation: 3,
    backgroundColor: "#F7F4EA", // card_bg
  },
  detailCard: {
    marginBottom: 24,
    borderRadius: 12,
    elevation: 4,
    backgroundColor: "#F7F4EA", // card_bg
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  surveyNumber: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6B4226", // text_primary
  },
  date: {
    fontSize: 14,
    color: "#8B5E3C", // text_secondary
  },
  riskContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  riskBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 12,
  },
  riskBadgeText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  yesCount: {
    fontSize: 14,
    color: "#A57C5C", // text_tertiary
  },
  messagePreview: {
    fontSize: 14,
    color: "#8B5E3C", // text_secondary
    lineHeight: 20,
  },
  riskMeter: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginVertical: 20,
  },
  riskText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
  },
  detail: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 12,
    color: "#8B5E3C",
  },
  riskMessage: {
    fontSize: 16,
    textAlign: "center",
    color: "#6B4226",
    lineHeight: 22,
    marginBottom: 20,
  },
  messageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  noResultText: {
    fontSize: 18,
    marginBottom: 16,
    textAlign: "center",
    color: "#8B5E3C",
  },
  button: {
    marginTop: 12,
    borderRadius: 8,
  },
  floatingButton: {
    marginTop: 16,
    borderRadius: 8,
  },
  listContent: {
    paddingBottom: 16,
  },
  graphCard: {
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: "#F7F4EA",
    elevation: 3,
  },
});
