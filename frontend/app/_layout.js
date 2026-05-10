import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../constants/theme";

export default function RootLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          height: 62,
          paddingBottom: 8,
          paddingTop: 4,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        headerStyle: { backgroundColor: COLORS.secondary },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "700", fontSize: 18 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Experts",
          tabBarLabel: "Experts",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="my-bookings"
        options={{
          title: "My Bookings",
          tabBarLabel: "Bookings",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" color={color} size={size} />
          ),
        }}
      />
      {/* Hidden screens accessible via navigation */}
      <Tabs.Screen
        name="expert/[id]"
        options={{ href: null, title: "Expert Details" }}
      />
      <Tabs.Screen
        name="booking/[expertId]"
        options={{ href: null, title: "Book Session" }}
      />
    </Tabs>
  );
}
