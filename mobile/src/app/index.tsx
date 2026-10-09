import { FindDonorsScreen } from '@/components/find-donors-screen'; 

import React, { useEffect, useState } from "react";
import {
  BackHandler,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import EmergencyRequest from "../components/EmergencyRequest";
import DonorResponse from "../components/DonorResponse";




export default function HomeScreen() {

type Screen = "home" | "request" | "responses";

  const [screen, setScreen] = useState<Screen>("home");

  const goHome = () => {
    console.log("PARENT BACK PRESSED");
    setScreen("home");
  };

  // Phone's own back button / swipe goes back to home instead of closing the app
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (screen !== "home") {
        setScreen("home");
        return true;
      }
      return false;
    });

    return () => sub.remove();
  }, [screen]);

  // ---------------------------------------------------
  // REQUEST / RESPONSES SCREENS (with parent-level Back bar)
  // ---------------------------------------------------
  if (screen === "request" || screen === "responses") {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.headerBar}>
          <Pressable
            onPress={goHome}
            hitSlop={20}
            style={({ pressed }) => [
              styles.headerBack,
              pressed && { opacity: 0.5 },
            ]}
          >
            {/* <Text style={styles.headerBackText}>← Back to Home</Text> */}
          </Pressable>
        </View>

        <View style={styles.body}>
          {screen === "request" ? (
            <EmergencyRequest
              onBack={goHome}
              onSuccess={() => setScreen("responses")}
            />
          ) : (
            <DonorResponse onBack={goHome} />
          )}
        </View>
      </SafeAreaView>
    );
  }

  // ---------------------------------------------------
  // HOME SCREEN
  // ---------------------------------------------------
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.logo}>🩸</Text>

        <Text style={styles.title}>Lifelink</Text>

        <Text style={styles.subtitle}>
          Emergency blood requests and donor responses
        </Text>

        <TouchableOpacity
          style={styles.emergencyButton}
          onPress={() => setScreen("request")}
        >
          <Text style={styles.buttonTitle}>🚨 Emergency Blood Request</Text>
          <Text style={styles.buttonText}>
            Create an urgent request for blood
          </Text>
        </TouchableOpacity>

<FindDonorsScreen />

        <TouchableOpacity
          style={styles.donorButton}
          onPress={() => setScreen("responses")}
        >
          <Text style={styles.buttonTitle}>🩸 Donor Response</Text>
          <Text style={styles.buttonText}>
            Respond to an emergency blood request
          </Text>
        </TouchableOpacity>

        <View style={styles.info}>
          <Text style={styles.infoTitle}>How it works</Text>

          <Text style={styles.infoText}>
            1. A patient or authorized person creates an emergency blood
            request.
          </Text>

          <Text style={styles.infoText}>
            2. Available donors can view the request.
          </Text>

          <Text style={styles.infoText}>
            3. A donor can respond if they are able to donate.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}




const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7f7f7",
  },

  headerBar: {
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
    paddingHorizontal: 10,
    paddingVertical: 6,
    zIndex: 100,
    elevation: 100,
  },

  headerBack: {
    alignSelf: "flex-start",
    paddingVertical: 12,
    paddingHorizontal: 12,
  },

  headerBackText: {
    color: "#b00020",
    fontSize: 17,
    fontWeight: "bold",
  },

  body: {
    flex: 1,
  },

  content: {
    padding: 20,
    paddingBottom: 40,
  },

  logo: {
    fontSize: 60,
    textAlign: "center",
    marginTop: 25,
  },

  title: {
    fontSize: 30,
    fontWeight: "bold",
    textAlign: "center",
    color: "#b00020",
    marginTop: 10,
  },

  subtitle: {
    textAlign: "center",
    color: "#666",
    fontSize: 15,
    marginTop: 8,
    marginBottom: 30,
  },

  emergencyButton: {
    backgroundColor: "#b00020",
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
  },

  donorButton: {
    backgroundColor: "#8e0000",
    borderRadius: 15,
    padding: 20,
    marginBottom: 25,
  },

  buttonTitle: {
    color: "white",
    fontSize: 19,
    fontWeight: "bold",
  },

  buttonText: {
    color: "white",
    marginTop: 8,
    fontSize: 14,
  },

  info: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
  },

  infoTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
  },

  infoText: {
    color: "#555",
    lineHeight: 22,
    marginBottom: 10,
  },
});
