import React, { useState } from "react";

import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import API_URL from "../../services/api";

type EmergencyRequestProps = {
  onBack?: () => void;
  onSuccess?: () => void;
};

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function EmergencyRequest({
  onBack,
  onSuccess,
}: EmergencyRequestProps) {
  const [patientName, setPatientName] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [hospital, setHospital] = useState("");
  const [location, setLocation] = useState("");
  const [unitsRequired, setUnitsRequired] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [loading, setLoading] = useState(false);

  // ---------------------------------------------------
  // BACK HANDLER
  // ---------------------------------------------------
  const handleBack = () => {
  Alert.alert("Back tapped", `onBack is ${onBack ? "set" : "MISSING"}`);
  onBack?.();
};

  // ---------------------------------------------------
  // CREATE EMERGENCY BLOOD REQUEST
  // ---------------------------------------------------
  const createEmergencyRequest = async () => {
    if (!patientName.trim()) {
      Alert.alert("Required", "Please enter patient name.");
      return;
    }

    if (!bloodGroup) {
      Alert.alert("Required", "Please select blood group.");
      return;
    }

    if (!hospital.trim()) {
      Alert.alert("Required", "Please enter hospital name.");
      return;
    }

    if (!location.trim()) {
      Alert.alert("Required", "Please enter hospital location.");
      return;
    }

    if (!unitsRequired.trim()) {
      Alert.alert("Required", "Please enter required units.");
      return;
    }

    if (!contactNumber.trim()) {
      Alert.alert("Required", "Please enter contact number.");
      return;
    }

    const units = Number(unitsRequired.trim());

    if (!Number.isInteger(units) || units < 1) {
      Alert.alert(
        "Invalid Units",
        "Required units must be a number greater than 0."
      );
      return;
    }

    setLoading(true);

    try {
      const requestData = {
        requesterId: "test-user-001",
        patientName: patientName.trim(),
        bloodGroup,
        hospital: hospital.trim(),
        location: location.trim(),
        unitsRequired: units,
        contactNumber: contactNumber.trim(),
      };

      const requestUrl = `${API_URL}/api/blood-requests`;

      console.log("CREATING BLOOD REQUEST");
      console.log("REQUEST URL:", requestUrl);
      console.log("REQUEST DATA:", requestData);

      const response = await fetch(requestUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(requestData),
      });

      const responseText = await response.text();

      console.log("SERVER STATUS:", response.status);
      console.log("SERVER RESPONSE:", responseText);

      let data: any = null;

      try {
        data = JSON.parse(responseText);
      } catch {
        data = null;
      }

      if (!response.ok) {
        throw new Error(
          data?.message || `Server error: HTTP ${response.status}`
        );
      }

      console.log("BLOOD REQUEST CREATED:", data);

      // Clear the form
      setPatientName("");
      setBloodGroup("");
      setHospital("");
      setLocation("");
      setUnitsRequired("");
      setContactNumber("");

      Alert.alert(
        "Success",
        "Emergency blood request created successfully!",
        [
          {
            text: "OK",
            onPress: () => onSuccess?.(),
          },
        ]
      );
    } catch (error) {
      // console.log instead of console.error to avoid Expo's red error screen
      console.log("CREATE BLOOD REQUEST ERROR:", error);

      let errorMessage = "Could not create emergency blood request.";

      if (error instanceof Error) {
        errorMessage = error.message;
      }

      Alert.alert("Create Request Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------
  // UI
  // ---------------------------------------------------
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* Always show the Back button, with a bigger touch area */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={handleBack}
        activeOpacity={0.6}
        hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
      >
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>🚨 Emergency Blood Request </Text>

      <Text style={styles.subtitle}>
        Create an urgent request so available donors can respond.
      </Text>

      <Text style={styles.label}>Patient Name</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter patient name"
        placeholderTextColor="#888888"
        value={patientName}
        onChangeText={setPatientName}
      />

      <Text style={styles.label}>Required Blood Group</Text>
      <View style={styles.bloodGroupContainer}>
        {BLOOD_GROUPS.map((group) => (
          <TouchableOpacity
            key={group}
            style={[
              styles.bloodButton,
              bloodGroup === group && styles.bloodButtonSelected,
            ]}
            onPress={() => setBloodGroup(group)}
          >
            <Text
              style={[
                styles.bloodButtonText,
                bloodGroup === group && styles.bloodButtonTextSelected,
              ]}
            >
              {group}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Hospital</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter hospital name"
        placeholderTextColor="#888888"
        value={hospital}
        onChangeText={setHospital}
      />

      <Text style={styles.label}>Location</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter hospital location"
        placeholderTextColor="#888888"
        value={location}
        onChangeText={setLocation}
      />

      <Text style={styles.label}>Required Units</Text>
      <TextInput
        style={styles.input}
        placeholder="Example: 2"
        placeholderTextColor="#888888"
        value={unitsRequired}
        onChangeText={setUnitsRequired}
        keyboardType="numeric"
      />

      <Text style={styles.label}>Contact Number</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter contact number"
        placeholderTextColor="#888888"
        value={contactNumber}
        onChangeText={setContactNumber}
        keyboardType="phone-pad"
      />

      <TouchableOpacity
        style={[styles.createButton, loading && styles.disabledButton]}
        onPress={createEmergencyRequest}
        disabled={loading}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#ffffff" />
            <Text style={styles.createButtonText}>Creating Request...</Text>
          </View>
        ) : (
          <Text style={styles.createButtonText}>
            Create Emergency Request
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7f7f7",
  },

  content: {
    padding: 20,
    paddingTop: 30, // extra space so the Back button is never cramped at the top
    paddingBottom: 60,
  },

  backButton: {
    alignSelf: "flex-start",
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 14,
    zIndex: 10,
    elevation: 10,
  },

  backButtonText: {
    color: "#b00020",
    fontSize: 17,
    fontWeight: "bold",
  },

  title: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#b00020",
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 16,
    color: "#666666",
    marginBottom: 20,
    lineHeight: 24,
  },

  label: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#222222",
    marginTop: 15,
    marginBottom: 8,
  },

  input: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#cccccc",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    color: "#222222",
  },

  bloodGroupContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  bloodButton: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#cccccc",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 18,
    minWidth: 65,
    alignItems: "center",
  },

  bloodButtonSelected: {
    backgroundColor: "#c00025",
    borderColor: "#c00025",
  },

  bloodButtonText: {
    color: "#c00025",
    fontSize: 16,
    fontWeight: "bold",
  },

  bloodButtonTextSelected: {
    color: "#ffffff",
  },

  createButton: {
    backgroundColor: "#c00025",
    borderRadius: 10,
    paddingVertical: 17,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 30,
    minHeight: 55,
  },

  disabledButton: {
    backgroundColor: "#999999",
  },

  createButtonText: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "bold",
  },

  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
});