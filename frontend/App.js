import "react-native-screens";
import { enableScreens } from "react-native-screens";
enableScreens();

import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";

import ExpertsScreen from "./src/screens/ExpertsScreen";
import ExpertDetailScreen from "./src/screens/ExpertDetailScreen";
import BookingScreen from "./src/screens/BookingScreen";
import BookingSuccessScreen from "./src/screens/BookingSuccessScreen";
import MyBookingsScreen from "./src/screens/MyBookingsScreen";

import { COLORS } from "./src/constants/theme";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const HEADER_STYLE = {
  headerStyle: { backgroundColor: COLORS.secondary },
  headerTintColor: "#fff",
  headerTitleStyle: { fontWeight: "700", fontSize: 22 },
  headerBackTitle: "",
};

function ExpertsStack() {
  return (
    <Stack.Navigator screenOptions={HEADER_STYLE}>
      <Stack.Screen
        name="ExpertsList"
        component={ExpertsScreen}
        options={{ title: "Find an Expert" }}
      />
      <Stack.Screen
        name="ExpertDetail"
        component={ExpertDetailScreen}
        options={{ title: "Expert Profile" }}
      />
      <Stack.Screen
        name="Booking"
        component={BookingScreen}
        options={{ title: "Book a Session" }}
      />
      <Stack.Screen
        name="BookingSuccess"
        component={BookingSuccessScreen}
        options={{ title: "Booking Confirmed" }}
      />
    </Stack.Navigator>
  );
}

function MyBookingsStack() {
  return (
    <Stack.Navigator screenOptions={HEADER_STYLE}>
      <Stack.Screen
        name="MyBookingsList"
        component={MyBookingsScreen}
        options={{ title: "My Bookings" }}
      />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarActiveTintColor: COLORS.primary,
            tabBarInactiveTintColor: COLORS.textMuted,
            tabBarStyle: {
              backgroundColor: COLORS.surface,
              borderTopColor: COLORS.border,
              height: 58,
              paddingBottom: 6,
              paddingTop: 4,
            },
            tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
            tabBarIcon: ({ color, size, focused }) => {
              const map = {
                Experts: focused ? "people" : "people-outline",
                "My Bookings": focused ? "calendar" : "calendar-outline",
              };
              return (
                <Ionicons name={map[route.name]} size={size} color={color} />
              );
            },
          })}
        >
          <Tab.Screen name="Experts" component={ExpertsStack} />
          <Tab.Screen name="My Bookings" component={MyBookingsStack} />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
