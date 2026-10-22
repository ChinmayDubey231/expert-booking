import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useFonts } from "expo-font";
// Per-weight imports, so only the five weights in use are bundled
import { PlusJakartaSans_400Regular } from "@expo-google-fonts/plus-jakarta-sans/400Regular";
import { PlusJakartaSans_500Medium } from "@expo-google-fonts/plus-jakarta-sans/500Medium";
import { PlusJakartaSans_600SemiBold } from "@expo-google-fonts/plus-jakarta-sans/600SemiBold";
import { PlusJakartaSans_700Bold } from "@expo-google-fonts/plus-jakarta-sans/700Bold";
import { PlusJakartaSans_800ExtraBold } from "@expo-google-fonts/plus-jakarta-sans/800ExtraBold";

import ExpertsScreen from "./src/screens/ExpertsScreen";
import ExpertDetailScreen from "./src/screens/ExpertDetailScreen";
import BookingScreen from "./src/screens/BookingScreen";
import BookingSuccessScreen from "./src/screens/BookingSuccessScreen";
import MyBookingsScreen from "./src/screens/MyBookingsScreen";

import { ProfileProvider } from "./src/context/ProfileContext";
import { getSocket } from "./src/services/socket";
import { COLORS, FONTS } from "./src/constants/theme";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const NAV_THEME = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: COLORS.accent,
    background: COLORS.ground,
    card: COLORS.surface,
    text: COLORS.ink,
    border: COLORS.line,
  },
};

const TAB_ICONS = {
  Experts: ["people", "people-outline"],
  MyBookings: ["calendar", "calendar-outline"],
};

function Tabs() {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.accent,
        tabBarInactiveTintColor: COLORS.textMuted,
        // Height includes the bottom safe-area inset, so the home indicator never overlaps
        tabBarStyle: {
          height: 68 + insets.bottom,
          paddingTop: 4,
          paddingBottom: insets.bottom + 4,
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.line,
        },
        tabBarLabelStyle: { fontFamily: FONTS.bold, fontSize: 11 },
        tabBarIconStyle: { width: 56, height: 30 },
        tabBarIcon: ({ color, focused }) => (
          <View style={[styles.tabIcon, focused && styles.tabIconActive]}>
            <Ionicons name={TAB_ICONS[route.name][focused ? 0 : 1]} size={22} color={color} />
          </View>
        ),
      })}
    >
      <Tab.Screen name="Experts" component={ExpertsScreen} />
      <Tab.Screen name="MyBookings" component={MyBookingsScreen} options={{ title: "My bookings" }} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  // Open the real-time connection up front so it's ready before the first profile opens
  useEffect(() => {
    getSocket();
  }, []);

  // If the fonts fail to load, carry on with the system font rather than a blank screen
  if (!fontsLoaded && !fontError) return <View style={styles.boot} />;

  return (
    <SafeAreaProvider>
      <ProfileProvider>
        <StatusBar style="dark" />
        <NavigationContainer theme={NAV_THEME}>
          {/* Tabs sit inside the stack, so the booking flow runs full-screen without the tab bar */}
          <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: COLORS.ground } }}>
            <Stack.Screen name="Tabs" component={Tabs} />
            <Stack.Screen
              name="ExpertDetail"
              component={ExpertDetailScreen}
              // One screen per expert, so navigating to a different expert pushes a fresh profile
              getId={({ params }) => params?.expertId}
            />
            <Stack.Screen name="Booking" component={BookingScreen} />
            <Stack.Screen
              name="BookingSuccess"
              component={BookingSuccessScreen}
              options={{ gestureEnabled: false }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </ProfileProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  boot: { flex: 1, backgroundColor: COLORS.ground },
  tabIcon: { width: 56, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  tabIconActive: { backgroundColor: COLORS.accentTint },
});
