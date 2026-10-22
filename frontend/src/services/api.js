import axios from "axios";
import Constants from "expo-constants";
import { Platform } from "react-native";

const API_PORT = 5000;

// Where the backend lives, in order of preference:
// 1. EXPO_PUBLIC_API_URL from frontend/.env — e.g. a deployed server, or when using --tunnel
// 2. The computer running `expo start` (its LAN IP works for Expo Go on a phone and emulators)
// 3. localhost, or 10.0.2.2 on an Android emulator (the emulator's alias for the host)
function resolveBaseUrl() {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv.replace(/\/+$/, "");

  let host = Constants.expoConfig?.hostUri?.split(":")[0];
  const isLoopback = !host || host === "localhost" || host === "127.0.0.1";
  if (isLoopback) host = Platform.OS === "android" ? "10.0.2.2" : "localhost";
  return `http://${host}:${API_PORT}`;
}

export const BASE_URL = resolveBaseUrl();

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 12000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const msg =
      err.response?.data?.message ||
      (err.request && !err.response
        ? `Can't reach the server at ${BASE_URL}. Is the backend running?`
        : err.message) ||
      "Something went wrong. Please try again.";
    const error = new Error(msg);
    error.status = err.response?.status; // e.g. 409 when a slot was taken
    return Promise.reject(error);
  }
);

// Experts
export const fetchExperts = (params) => api.get("/experts", { params });
export const fetchExpertById = (id) => api.get(`/experts/${id}`);

// Bookings
export const createBooking = (data) => api.post("/bookings", data);
export const fetchBookingsByEmail = (email) =>
  api.get("/bookings", { params: { email } });
export const cancelBooking = (id, email) =>
  api.patch(`/bookings/${id}/cancel`, { email });
