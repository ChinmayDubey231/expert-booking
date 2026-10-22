const DATE_STYLES = {
  short: { weekday: "short", day: "numeric", month: "short" },          // Thu, 23 Oct
  day: { weekday: "long", day: "numeric", month: "long" },             // Thursday, 23 October
  medium: { day: "numeric", month: "short", year: "numeric" },          // 23 Oct 2026
  mediumDay: { weekday: "short", day: "numeric", month: "short", year: "numeric" }, // Thu, 23 Oct 2026
  long: { weekday: "long", day: "numeric", month: "long", year: "numeric" },
};

// "YYYY-MM-DD" → local midnight
export const parseDateKey = (key) => new Date(`${key}T00:00:00`);

export function formatDate(key, style = "medium") {
  if (!key) return "";
  return parseDateKey(key).toLocaleDateString("en-IN", DATE_STYLES[style]);
}

export const formatPrice = (amount) => `₹${Number(amount || 0).toLocaleString("en-IN")}`;

// ("2026-10-23", "02:00 PM") → Date
export function slotStart(dateKey, time) {
  const d = parseDateKey(dateKey);
  const match = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(time || "");
  if (match) {
    let hours = Number(match[1]) % 12;
    if (match[3].toUpperCase() === "PM") hours += 12;
    d.setHours(hours, Number(match[2]), 0, 0);
  }
  return d;
}

// Short reference shown to users, e.g. "#3F9A1C2B"
export const bookingRef = (booking) => booking._id?.slice(-8).toUpperCase();

// "Dr. Arjun Nair" → "AN"
export function initials(name = "") {
  const words = name.replace(/^(dr|mr|mrs|ms)\.?\s+/i, "").trim().split(/\s+/);
  return words.slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
}

export function greeting(date = new Date()) {
  const h = date.getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}
