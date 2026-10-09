import Constants from "expo-constants";
import { Platform } from "react-native";

const API_PORT = 5000;

function getApiBaseUrl() {
  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.linkingUri ||
    "";

  const lanHost = String(hostUri)
    .replace(/^https?:\/\//, "")
    .split("/")[0]
    .split(":")[0];

  if (
    lanHost &&
    lanHost !== "localhost" &&
    lanHost !== "127.0.0.1"
  ) {
    return `http://${lanHost}:${API_PORT}`;
  }

  if (Platform.OS === "android") {
    return `http://10.0.2.2:${API_PORT}`;
  }

  return `http://localhost:${API_PORT}`;
}

const API_URL = getApiBaseUrl();

export default API_URL;
