const Expert = require("../models/Expert");

// Every expert offers the same daily hours; dates roll forward automatically.
const SLOT_TIMES = [
  "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
  "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM",
];
const DAYS_AHEAD = 7;

// "YYYY-MM-DD" in server-local time (toISOString() would shift the date in UTC+ zones)
const toDateKey = (d) => {
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

// ("2025-06-20", "02:00 PM") → Date in server-local time
const slotStart = (date, time) => {
  const [y, m, d] = date.split("-").map(Number);
  const match = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(time.trim());
  if (!match) return new Date(NaN);
  let hours = Number(match[1]) % 12;
  if (match[3].toUpperCase() === "PM") hours += 12;
  return new Date(y, m - 1, d, hours, Number(match[2]));
};

// Unparseable slots count as past, so they can never be booked
const isPastSlot = (date, time, now = new Date()) => !(slotStart(date, time) > now);

// Tomorrow through DAYS_AHEAD days out
const upcomingDateKeys = (from = new Date()) =>
  Array.from({ length: DAYS_AHEAD }, (_, i) => {
    const d = new Date(from);
    d.setDate(d.getDate() + i + 1);
    return toDateKey(d);
  });

const buildSlots = (dateKeys) =>
  dateKeys.flatMap((date) => SLOT_TIMES.map((time) => ({ date, time, isBooked: false })));

// Drops past dates and appends missing upcoming ones, so availability never runs dry
// after the seed date. Bookings live in their own collection, so pruning is safe.
const refreshUpcomingSlots = async () => {
  const today = toDateKey(new Date());
  const upcoming = upcomingDateKeys();

  await Expert.updateMany(
    { "availableSlots.date": { $lt: today } },
    { $pull: { availableSlots: { date: { $lt: today } } } }
  );

  const experts = await Expert.find({}, { "availableSlots.date": 1 }).lean();
  const ops = experts.flatMap((expert) => {
    const existing = new Set(expert.availableSlots.map((s) => s.date));
    const missing = upcoming.filter((date) => !existing.has(date));
    if (!missing.length) return [];
    return [{
      updateOne: {
        filter: { _id: expert._id },
        update: { $push: { availableSlots: { $each: buildSlots(missing) } } },
      },
    }];
  });

  if (ops.length) await Expert.bulkWrite(ops);
  return ops.length;
};

module.exports = {
  SLOT_TIMES,
  toDateKey,
  slotStart,
  isPastSlot,
  upcomingDateKeys,
  buildSlots,
  refreshUpcomingSlots,
};
