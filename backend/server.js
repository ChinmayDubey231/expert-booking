require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const connectDB = require("./config/db");

const Expert = require("./models/Expert");
const Booking = require("./models/Booking");
const expertRoutes = require("./routes/expertRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const errorHandler = require("./middleware/errorHandler");
const { refreshUpcomingSlots } = require("./utils/slots");

const SLOT_REFRESH_MS = 60 * 60 * 1000; // hourly

const app = express();
const httpServer = http.createServer(app);

// Socket.io setup
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "*",
    methods: ["GET", "POST", "PATCH"],
  },
});

// Make io accessible in routes/controllers
app.set("io", io);

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || "*" }));
app.use(express.json());

// Routes
app.use("/experts", expertRoutes);
app.use("/bookings", bookingRoutes);

// Health check
app.get("/health", (req, res) => res.json({ status: "ok", timestamp: new Date() }));

app.use((req, res) => res.status(404).json({ success: false, message: "Route not found" }));

// Socket.io events
io.on("connection", (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Client joins a room for a specific expert to watch their slot updates
  socket.on("join_expert_room", (expertId) => {
    if (typeof expertId !== "string") return;
    socket.join(`expert_${expertId}`);
    console.log(`Socket ${socket.id} joined room: expert_${expertId}`);
  });

  socket.on("leave_expert_room", (expertId) => {
    if (typeof expertId !== "string") return;
    socket.leave(`expert_${expertId}`);
  });

  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// Error handler (must be last)
app.use(errorHandler);

const refreshSlots = async () => {
  try {
    const updated = await refreshUpcomingSlots();
    if (updated) console.log(`📅 Added upcoming slots for ${updated} expert(s)`);
  } catch (err) {
    console.error(`[slots] refresh failed: ${err.message}`);
  }
};

const start = async () => {
  await connectDB();
  // Build indexes the schemas define and drop ones they no longer do
  // (e.g. the old non-partial booking index that blocked rebooking cancelled slots)
  await Promise.all([Expert.syncIndexes(), Booking.syncIndexes()]);
  await refreshSlots();
  setInterval(refreshSlots, SLOT_REFRESH_MS);

  const PORT = process.env.PORT || 5000;
  httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV}`);
  });
};

start().catch((err) => {
  console.error(`❌ Startup failed: ${err.message}`);
  process.exit(1);
});
