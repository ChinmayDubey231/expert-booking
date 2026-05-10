import axios from "axios";

// ─── CHANGE THIS to your local IP when testing on a physical device ──────────
// Android emulator  → "http://10.0.2.2:5000"
// iOS simulator     → "http://localhost:5000"
// Physical device   → "http://<YOUR_MACHINE_IP>:5000"  e.g. "http://192.168.1.5:5000"
export const BASE_URL = "http://192.168.1.5:5000";

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
      err.message ||
      "Something went wrong. Please try again.";
    return Promise.reject(new Error(msg));
  },
);

// Experts
export const fetchExperts = (params) => api.get("/experts", { params });
export const fetchExpertById = (id) => api.get(`/experts/${id}`);

// Bookings
export const createBooking = (data) => api.post("/bookings", data);
export const fetchBookingsByEmail = (email) =>
  api.get("/bookings", { params: { email } });
export const updateBookingStatus = (id, status) =>
  api.patch(`/bookings/${id}/status`, { status });
