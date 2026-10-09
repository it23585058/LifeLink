import React, { useEffect, useState } from "react";
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

type DonorResponseProps = {
  onBack?: () => void;
};

type BloodRequest = {
  _id: string;
  requesterId: string;
  patientName: string;
  bloodGroup: string;
  hospital: string;
  location: string;
  unitsRequired: number;
  contactNumber: string;
  status: "PENDING" | "FULFILLED" | "CANCELLED";
  createdAt?: string;
};

type EditForm = {
  patientName: string;
  bloodGroup: string;
  hospital: string;
  location: string;
  unitsRequired: string;
  contactNumber: string;
};

const BLOOD_GROUPS = [
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
];

async function readJson(response: Response) {
  const text = await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

export default function DonorResponse({
  onBack,
}: DonorResponseProps) {
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [editingId, setEditingId] = useState("");
  const [editForm, setEditForm] = useState<EditForm>({
    patientName: "",
    bloodGroup: "",
    hospital: "",
    location: "",
    unitsRequired: "",
    contactNumber: "",
  });
  const [savingId, setSavingId] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const [confirmingId, setConfirmingId] = useState("");

  const loadBloodRequests = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const response = await fetch(`${API_URL}/api/blood-requests`, {
        headers: {
          Accept: "application/json",
        },
      });
      const data = await readJson(response);

      if (!response.ok) {
        throw new Error(
          data?.message || "Failed to load blood requests."
        );
      }

      setRequests(Array.isArray(data) ? data : []);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Could not load blood requests."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBloodRequests();
  }, []);

  const respondToRequest = async (requestId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/donor-responses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bloodRequestId: requestId,
          donorId: "test-donor-001",
          donorName: "Test Donor",
          donorContact: "0000000000",
          response: "WILL_DONATE",
        }),
      });

      const data = await readJson(response);

      if (!response.ok) {
        throw new Error(
          data?.message || "Could not send donor response."
        );
      }

      Alert.alert(
        "Thank you",
        "Your donor response was submitted."
      );
    } catch (error) {
      Alert.alert(
        "Donor response error",
        error instanceof Error
          ? error.message
          : "Could not send donor response."
      );
    }
  };

  const startEdit = (request: BloodRequest) => {
    setEditingId(request._id);
    setEditForm({
      patientName: request.patientName,
      bloodGroup: request.bloodGroup,
      hospital: request.hospital,
      location: request.location,
      unitsRequired: String(request.unitsRequired),
      contactNumber: request.contactNumber,
    });
  };

  const cancelEdit = () => {
    setEditingId("");
  };

  const updateRequest = async (requestId: string) => {
    if (!editForm.patientName.trim()) {
      Alert.alert("Required", "Please enter patient name.");
      return;
    }

    if (!editForm.bloodGroup) {
      Alert.alert("Required", "Please select blood group.");
      return;
    }

    if (!editForm.hospital.trim()) {
      Alert.alert("Required", "Please enter hospital name.");
      return;
    }

    if (!editForm.location.trim()) {
      Alert.alert("Required", "Please enter location.");
      return;
    }

    if (!editForm.contactNumber.trim()) {
      Alert.alert("Required", "Please enter contact number.");
      return;
    }

    const units = Number(editForm.unitsRequired.trim());

    if (!Number.isInteger(units) || units < 1) {
      Alert.alert(
        "Invalid Units",
        "Required units must be a number greater than 0."
      );
      return;
    }

    try {
      setSavingId(requestId);

      const response = await fetch(
        `${API_URL}/api/blood-requests/${requestId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            patientName: editForm.patientName.trim(),
            bloodGroup: editForm.bloodGroup,
            hospital: editForm.hospital.trim(),
            location: editForm.location.trim(),
            unitsRequired: units,
            contactNumber: editForm.contactNumber.trim(),
          }),
        }
      );

      const data = await readJson(response);

      if (!response.ok) {
        throw new Error(
          data?.message || "Could not update blood request."
        );
      }

      const updatedRequest = data?.data as BloodRequest | undefined;

      if (updatedRequest?._id) {
        setRequests((current) =>
          current.map((item) =>
            item._id === requestId ? updatedRequest : item
          )
        );
      }

      setEditingId("");
      await loadBloodRequests();

      Alert.alert("Updated", "Blood request updated successfully.");
    } catch (error) {
      Alert.alert(
        "Update error",
        error instanceof Error
          ? error.message
          : "Could not update blood request."
      );
    } finally {
      setSavingId("");
    }
  };

  const confirmDelete = async (requestId: string) => {
    try {
      setDeletingId(requestId);

      const response = await fetch(
        `${API_URL}/api/blood-requests/${requestId}`,
        {
          method: "DELETE",
          headers: {
            Accept: "application/json",
          },
        }
      );

      const data = await readJson(response);

      if (!response.ok) {
        throw new Error(
          data?.message || "Could not delete blood request."
        );
      }

      if (editingId === requestId) {
        setEditingId("");
      }

      setConfirmingId("");
      setRequests((current) =>
        current.filter((item) => item._id !== requestId)
      );

      Alert.alert("Deleted", "Blood request removed from the database.");
    } catch (error) {
      Alert.alert(
        "Delete error",
        error instanceof Error
          ? error.message
          : "Could not delete blood request."
      );
    } finally {
      setDeletingId("");
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {onBack && (
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
      )}

      <Text style={styles.title}>🩸 Donor Response</Text>

      <Text style={styles.subtitle}>
        View emergency blood requests, update or remove a request, and
        respond if you are able to donate.
      </Text>

      {loading && (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#c00025" />
          <Text style={styles.loadingText}>Loading blood requests...</Text>
        </View>
      )}

      {!loading && errorMessage !== "" && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>❌ {errorMessage}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={loadBloodRequests}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )}

      {!loading && errorMessage === "" && requests.length === 0 && (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyTitle}>No Emergency Requests</Text>
          <Text style={styles.emptyText}>
            There are currently no pending blood requests.
          </Text>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={loadBloodRequests}
          >
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      )}

      {!loading &&
        errorMessage === "" &&
        requests.map((request) => (
          <View key={request._id} style={styles.requestCard}>
            {editingId === request._id ? (
              <View>
                <Text style={styles.editTitle}>Update Request</Text>

                <Text style={styles.label}>Patient Name</Text>
                <TextInput
                  style={styles.input}
                  value={editForm.patientName}
                  onChangeText={(text) =>
                    setEditForm((current) => ({
                      ...current,
                      patientName: text,
                    }))
                  }
                />

                <Text style={styles.label}>Required Blood Group</Text>
                <View style={styles.bloodGroupContainer}>
                  {BLOOD_GROUPS.map((group) => (
                    <TouchableOpacity
                      key={group}
                      style={[
                        styles.bloodButton,
                        editForm.bloodGroup === group &&
                          styles.bloodButtonSelected,
                      ]}
                      onPress={() =>
                        setEditForm((current) => ({
                          ...current,
                          bloodGroup: group,
                        }))
                      }
                    >
                      <Text
                        style={[
                          styles.bloodButtonText,
                          editForm.bloodGroup === group &&
                            styles.bloodButtonTextSelected,
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
                  value={editForm.hospital}
                  onChangeText={(text) =>
                    setEditForm((current) => ({
                      ...current,
                      hospital: text,
                    }))
                  }
                />

                <Text style={styles.label}>Location</Text>
                <TextInput
                  style={styles.input}
                  value={editForm.location}
                  onChangeText={(text) =>
                    setEditForm((current) => ({
                      ...current,
                      location: text,
                    }))
                  }
                />

                <Text style={styles.label}>Required Units</Text>
                <TextInput
                  style={styles.input}
                  value={editForm.unitsRequired}
                  onChangeText={(text) =>
                    setEditForm((current) => ({
                      ...current,
                      unitsRequired: text,
                    }))
                  }
                  keyboardType="numeric"
                />

                <Text style={styles.label}>Contact Number</Text>
                <TextInput
                  style={styles.input}
                  value={editForm.contactNumber}
                  onChangeText={(text) =>
                    setEditForm((current) => ({
                      ...current,
                      contactNumber: text,
                    }))
                  }
                  keyboardType="phone-pad"
                />

                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={cancelEdit}
                    disabled={savingId === request._id}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={() => updateRequest(request._id)}
                    disabled={savingId === request._id}
                  >
                    {savingId === request._id ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.saveButtonText}>Save Update</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <>
                <View style={styles.requestHeader}>
                  <Text style={styles.patientName}>
                    {request.patientName}
                  </Text>
                  <View style={styles.bloodBadge}>
                    <Text style={styles.bloodBadgeText}>
                      {request.bloodGroup}
                    </Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <Text style={styles.detail}>
                  🏥 Hospital:{" "}
                  <Text style={styles.detailValue}>{request.hospital}</Text>
                </Text>

                <Text style={styles.detail}>
                  📍 Location:{" "}
                  <Text style={styles.detailValue}>{request.location}</Text>
                </Text>

                <Text style={styles.detail}>
                  🩸 Required Units:{" "}
                  <Text style={styles.detailValue}>
                    {request.unitsRequired}
                  </Text>
                </Text>

                <Text style={styles.detail}>
                  📞 Contact:{" "}
                  <Text style={styles.detailValue}>
                    {request.contactNumber}
                  </Text>
                </Text>

                <View style={styles.statusContainer}>
                  <Text style={styles.statusLabel}>Status:</Text>
                  <Text style={styles.status}>{request.status}</Text>
                </View>

                {confirmingId === request._id ? (
                  <View>
                    <Text style={styles.confirmText}>
                      Remove this blood request from the database? This
                      cannot be undone.
                    </Text>
                    <View style={styles.actionRow}>
                      <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => setConfirmingId("")}
                        disabled={deletingId === request._id}
                      >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => confirmDelete(request._id)}
                        disabled={deletingId === request._id}
                      >
                        {deletingId === request._id ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <Text style={styles.deleteButtonText}>
                            Confirm Delete
                          </Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={styles.updateButton}
                      onPress={() => startEdit(request)}
                    >
                      <Text style={styles.updateButtonText}>Update</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => setConfirmingId(request._id)}
                    >
                      <Text style={styles.deleteButtonText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {request.status === "PENDING" && (
                  <TouchableOpacity
                    style={styles.respondButton}
                    onPress={() => respondToRequest(request._id)}
                  >
                    <Text style={styles.respondButtonText}>
                      I Can Donate
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7f7f7",
  },

  content: {
    padding: 20,
    paddingBottom: 60,
  },

  backButton: {
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 10,
  },

  backButtonText: {
    color: "#b00020",
    fontSize: 16,
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
    color: "#666",
    lineHeight: 23,
    marginBottom: 25,
  },

  loadingBox: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 30,
    alignItems: "center",
  },

  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },

  errorBox: {
    backgroundColor: "#f8d7da",
    borderWidth: 1,
    borderColor: "#dc3545",
    borderRadius: 12,
    padding: 18,
    alignItems: "center",
  },

  errorText: {
    color: "#721c24",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 15,
  },

  retryButton: {
    backgroundColor: "#c00025",
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 8,
  },

  retryButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },

  emptyBox: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 30,
    alignItems: "center",
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },

  emptyText: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },

  refreshButton: {
    backgroundColor: "#c00025",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
  },

  refreshButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },

  requestCard: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 3,
  },

  requestHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  patientName: {
    fontSize: 21,
    fontWeight: "bold",
    color: "#222",
    flex: 1,
  },

  bloodBadge: {
    backgroundColor: "#c00025",
    borderRadius: 25,
    minWidth: 55,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: "center",
  },

  bloodBadgeText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "bold",
  },

  divider: {
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 15,
  },

  detail: {
    fontSize: 15,
    color: "#555",
    marginBottom: 10,
  },

  detailValue: {
    color: "#222",
    fontWeight: "600",
  },

  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
    marginBottom: 15,
  },

  statusLabel: {
    fontSize: 15,
    color: "#555",
    marginRight: 8,
  },

  status: {
    color: "#c00025",
    fontSize: 15,
    fontWeight: "bold",
  },

  editTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#b00020",
    marginBottom: 12,
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 6,
  },

  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: "#fafafa",
    marginBottom: 12,
    color: "#222",
  },

  bloodGroupContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 12,
  },

  bloodButton: {
    borderWidth: 1,
    borderColor: "#c00025",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
  },

  bloodButtonSelected: {
    backgroundColor: "#c00025",
  },

  bloodButtonText: {
    color: "#c00025",
    fontWeight: "bold",
  },

  bloodButtonTextSelected: {
    color: "#fff",
  },

  actionRow: {
    flexDirection: "row",
    gap: 10,
  },

  updateButton: {
    flex: 1,
    backgroundColor: "#1b6b93",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },

  updateButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },

  deleteButton: {
    flex: 1,
    backgroundColor: "#8e0000",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },

  deleteButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },

  cancelButton: {
    flex: 1,
    backgroundColor: "#eee",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },

  cancelButtonText: {
    color: "#333",
    fontSize: 16,
    fontWeight: "bold",
  },

  saveButton: {
    flex: 1,
    backgroundColor: "#1b6b93",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },

  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },

  confirmText: {
    color: "#721c24",
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },

  respondButton: {
    backgroundColor: "#c00025",
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 12,
  },

  respondButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
