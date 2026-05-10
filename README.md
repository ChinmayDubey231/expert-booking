# ExpertBook — Real-Time Expert Session Booking System

A full-stack mobile application for booking 1-on-1 sessions with domain experts. Built with **React Native (Expo)**, **Node.js + Express**, **MongoDB**, and **Socket.io** for real-time slot updates.

---

## Tech Stack

| Layer       | Technology                                            |
| ----------- | ----------------------------------------------------- |
| Mobile App  | React Native (Expo SDK 54)                            |
| Navigation  | React Navigation v6 (Stack + Bottom Tabs)             |
| Backend     | Node.js + Express.js                                  |
| Database    | MongoDB + Mongoose                                    |
| Real-Time   | Socket.io                                             |
| HTTP Client | Axios                                                 |
| Validation  | express-validator (backend) + custom hooks (frontend) |

---

## Features

### 1. Expert Listing Screen

- Displays all experts with name, category, experience, rating, and hourly rate
- **Search by name** with 400ms debounce
- **Filter by category** via horizontal chip selector (Technology, Business, Design, Finance, etc.)
- **Pagination** — loads 6 experts per page, fetches more on scroll
- Loading spinner, error state with retry, pull-to-refresh

### 2. Expert Detail Screen

- Full expert profile (bio, rating, experience, rate)
- Available time slots **grouped by date** for the next 7 days
- **Real-time slot updates** via Socket.io — slots booked by other users are instantly disabled across all connected clients
- Tap a slot to select, tap again to deselect
- Sticky "Book Now" bar appears after slot selection

### 3. Booking Screen

- Form fields: **Name, Email, Phone, Notes** (Date + Time Slot pre-filled from selection)
- **Live field-level validation** as you type
- Full validation on submit with descriptive error messages
- **Dedicated success screen** after booking with full session summary and booking reference

### 4. My Bookings Screen

- Look up all bookings by **email address**
- Displays booking status with color-coded badges: `Pending` · `Confirmed` · `Completed` · `Cancelled`
- Pull-to-refresh support
- Summary count strip showing breakdown by status

---

## Project Structure

```
expert-booking/
│
├── backend/
│   ├── config/
│   │   └── db.js                  # MongoDB connection
│   ├── models/
│   │   ├── Expert.js              # Expert schema with embedded slot sub-documents
│   │   └── Booking.js             # Booking schema with unique compound index
│   ├── controllers/
│   │   ├── expertController.js    # GET /experts, GET /experts/:id
│   │   └── bookingController.js   # POST, GET, PATCH /bookings
│   ├── routes/
│   │   ├── expertRoutes.js
│   │   └── bookingRoutes.js       # Routes with express-validator middleware
│   ├── middleware/
│   │   └── errorHandler.js        # Global error handler
│   ├── server.js                  # Express + Socket.io entry point
│   ├── seed.js                    # Seeds 12 experts with 7-day slots
│   └── .env.example
│
└── frontend/
    ├── App.js                     # NavigationContainer + Tab + Stack navigators
    ├── index.js                   # registerRootComponent entry point
    └── src/
        ├── screens/
        │   ├── ExpertsScreen.js       # Screen 1: Listing
        │   ├── ExpertDetailScreen.js  # Screen 2: Detail + real-time slots
        │   ├── BookingScreen.js       # Screen 3: Booking form
        │   ├── BookingSuccessScreen.js
        │   └── MyBookingsScreen.js    # Screen 4: My Bookings
        ├── hooks/
        │   └── useSocket.js           # Socket.io connection + room management
        ├── services/
        │   └── api.js                 # Axios instance + all API calls
        ├── components/
        │   └── UI.js                  # Button, Card, Badge, FormField, etc.
        └── constants/
            └── theme.js               # Colors, spacing, radius, shadows
```

---

## Setup & Running Locally

### Prerequisites

- Node.js 18+
- MongoDB running locally **or** a MongoDB Atlas URI
- Expo Go app installed on your Android/iOS device

---

### Backend

```bash
cd backend
npm install

# Set up environment variables
cp .env.example .env
# Edit .env and set your MONGODB_URI

# Seed the database (12 experts, slots for next 7 days)
npm run seed

# Start dev server
npm run dev
```

Server starts at `http://localhost:5000`

---

### Frontend

```bash
cd frontend
npm install
```

**Important:** Open `src/services/api.js` and update `BASE_URL` to your machine's local IP:

```js
// Android emulator
export const BASE_URL = "http://10.0.2.2:5000";

// Physical device — use your machine's LAN IP shown in Metro logs
export const BASE_URL = "http://192.168.x.x:5000";
```

```bash
npx expo start
```

Scan the QR code with **Expo Go** on your device.

---

## API Reference

### Experts

| Method | Endpoint       | Description                                |
| ------ | -------------- | ------------------------------------------ |
| `GET`  | `/experts`     | List experts with pagination and filters   |
| `GET`  | `/experts/:id` | Get single expert with all available slots |

**Query parameters for `GET /experts`:**

| Param      | Type   | Default | Description                             |
| ---------- | ------ | ------- | --------------------------------------- |
| `page`     | number | `1`     | Page number                             |
| `limit`    | number | `6`     | Results per page                        |
| `category` | string | —       | Filter by category                      |
| `search`   | string | —       | Search by name (case-insensitive regex) |

### Bookings

| Method  | Endpoint               | Description                   |
| ------- | ---------------------- | ----------------------------- |
| `POST`  | `/bookings`            | Create a new booking          |
| `GET`   | `/bookings?email=`     | Get all bookings for an email |
| `PATCH` | `/bookings/:id/status` | Update booking status         |

**`POST /bookings` request body:**

```json
{
  "expertId": "664abc...",
  "userName": "Chinmay Dubey",
  "email": "chinmay@example.com",
  "phone": "9876543210",
  "date": "2026-05-15",
  "timeSlot": "10:00 AM",
  "notes": "Want to discuss system design"
}
```

---

## Critical Implementation Details

### Double Booking Prevention (Race-Condition Safe)

Two independent layers of protection ensure no slot can ever be double-booked:

**Layer 1 — MongoDB Transaction with Optimistic Locking**

```js
// Only updates the slot if it is still free at the moment of write
await Expert.findOneAndUpdate(
  {
    _id: expertId,
    "availableSlots.date": date,
    "availableSlots.time": timeSlot,
    "availableSlots.isBooked": false, // ← atomic condition
  },
  { $set: { "availableSlots.$.isBooked": true } },
  { session },
);
```

**Layer 2 — Unique Compound Index (final safety net)**

```js
bookingSchema.index({ expertId: 1, date: 1, timeSlot: 1 }, { unique: true });
```

Even if two concurrent requests both pass Layer 1, only one `save()` will succeed at the database level. The other receives error code `11000` (duplicate key), caught and returned as `HTTP 409 Conflict`.

---

### Real-Time Slot Updates (Socket.io)

```
Client opens Expert Detail
       ↓
socket.emit("join_expert_room", expertId)
       ↓
Another user books a slot
       ↓
Server: io.to(`expert_${expertId}`).emit("slot_booked", { date, timeSlot })
       ↓
All connected clients update slot state instantly — no re-fetch needed
```

If a booking is cancelled, the server emits `slot_freed` and the slot becomes selectable again in real-time.

---

### Validation

- **Backend:** `express-validator` middleware on all booking routes. Errors returned as a structured array with field names and messages.
- **Frontend:** Per-field validators run on every keystroke. Full validation also runs on form submit before the API call is made.

---

## Environment Variables

Create a `.env` file inside the `backend/` directory:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/expert-booking
CLIENT_URL=http://localhost:3000
NODE_ENV=development
```

---

## Author

Built as part of a React Native internship assignment.  
Stack: React Native · Expo SDK 54 · Node.js · Express · MongoDB · Socket.io
