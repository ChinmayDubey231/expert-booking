import axios from "axios";

// ⚠️ Change this to your machine's local IP when testing on a physical device
// e.g., "http://192.168.1.5:5000"
// For Android emulator use: "http://10.0.2.2:5000"
const BASE_URL = "http://192.168.1.5:5000";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

// Response interceptor for consistent error handling
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      "Something went wrong. Please try again.";
    return Promise.reject(new Error(message));
  },
);

// ─── Expert APIs ────────────────────────────────────────────────
export const fetchExperts = (params = {}) => api.get("/experts", { params });

export const fetchExpertById = (id) => api.get(`/experts/${id}`);

// ─── Booking APIs ───────────────────────────────────────────────
export const createBooking = (data) => api.post("/bookings", data);

export const fetchBookingsByEmail = (email) =>
  api.get("/bookings", { params: { email } });

export const updateBookingStatus = (id, status) =>
  api.patch(`/bookings/${id}/status`, { status });

export const SOCKET_URL = BASE_URL;
