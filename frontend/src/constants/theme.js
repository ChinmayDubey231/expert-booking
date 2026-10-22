// "Pine & Porcelain" — the source of truth is the Foundations artboard on the
// ExpertBook App Redesign canvas (Claude Design).

export const COLORS = {
  accent: "#0F6B5C",
  accentPressed: "#0A5246",
  accentTint: "#E2EDEB", // accent at 12% on white
  accentRing: "rgba(15, 107, 92, 0.16)", // focus ring

  ink: "#0F1F1C",
  textSecondary: "#4A5A57",
  textMuted: "#5F6E6B", // 5.4:1 on white, 4.9:1 on ground
  placeholder: "#6B7976",

  ground: "#F3F5F4",
  surface: "#FFFFFF",
  surfaceSunken: "#FAFBFB",
  line: "#E1E6E4",
  lineSoft: "#EDF0EF",
  segment: "#E7EBEA",

  star: "#E9A23B", // icons only — too light for text
  danger: "#B42318",
  dangerTint: "#FDECEA",
  dangerLine: "#F3C9C4",
  warning: "#8A5A00",
  warningTint: "#FDF3E1",
  neutral: "#3D4A5C",
  neutralTint: "#EAEDF1",
};

export const STATUS_COLORS = {
  Confirmed: { fg: COLORS.accent, bg: COLORS.accentTint },
  Pending: { fg: COLORS.warning, bg: COLORS.warningTint },
  Completed: { fg: COLORS.neutral, bg: COLORS.neutralTint },
  Cancelled: { fg: COLORS.danger, bg: COLORS.dangerTint },
};

// Custom fonts need one family per weight (fontWeight is ignored for them on Android)
export const FONTS = {
  regular: "PlusJakartaSans_400Regular",
  medium: "PlusJakartaSans_500Medium",
  semibold: "PlusJakartaSans_600SemiBold",
  bold: "PlusJakartaSans_700Bold",
  extrabold: "PlusJakartaSans_800ExtraBold",
};

export const TYPE = {
  display: { fontFamily: FONTS.extrabold, fontSize: 28, lineHeight: 34, letterSpacing: -0.5, color: COLORS.ink },
  title: { fontFamily: FONTS.extrabold, fontSize: 22, lineHeight: 28, letterSpacing: -0.3, color: COLORS.ink },
  heading: { fontFamily: FONTS.bold, fontSize: 17, lineHeight: 22, color: COLORS.ink },
  body: { fontFamily: FONTS.medium, fontSize: 15, lineHeight: 22, color: COLORS.textSecondary },
  bodyStrong: { fontFamily: FONTS.bold, fontSize: 15, lineHeight: 20, color: COLORS.ink },
  small: { fontFamily: FONTS.medium, fontSize: 13, lineHeight: 18, color: COLORS.textSecondary },
  smallStrong: { fontFamily: FONTS.bold, fontSize: 13, lineHeight: 18, color: COLORS.ink },
  caption: { fontFamily: FONTS.semibold, fontSize: 12, lineHeight: 16, color: COLORS.textMuted },
  eyebrow: {
    fontFamily: FONTS.bold, fontSize: 12, lineHeight: 16,
    letterSpacing: 0.6, textTransform: "uppercase", color: COLORS.textMuted,
  },
};

export const SPACING = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 };
export const GUTTER = 20; // screen side padding

export const RADIUS = { field: 12, button: 14, card: 16, hero: 20, pill: 999 };

export const SHADOW = {
  // Sticky bottom bars
  bar: {
    shadowColor: COLORS.ink,
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 8,
  },
  // Selected segment
  raised: {
    shadowColor: COLORS.ink,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },
};

export const CATEGORIES = [
  "All",
  "Technology",
  "Business",
  "Design",
  "Marketing",
  "Finance",
  "Health",
  "Legal",
  "Education",
];

export const CATEGORY_ICONS = {
  All: "grid-outline",
  Technology: "laptop-outline",
  Business: "briefcase-outline",
  Design: "color-palette-outline",
  Marketing: "megaphone-outline",
  Finance: "cash-outline",
  Health: "heart-outline",
  Legal: "shield-checkmark-outline",
  Education: "school-outline",
};
