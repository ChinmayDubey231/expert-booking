import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "expertbook.profile.v1";
const EMPTY_PROFILE = { userName: "", email: "", phone: "" };

const ProfileContext = createContext(null);

// Remembers the details from the last booking (on this device only), so the booking
// form is prefilled and My Bookings can load without asking for the email again.
export function ProfileProvider({ children }) {
  const [profile, setProfile] = useState(EMPTY_PROFILE);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setProfile({ ...EMPTY_PROFILE, ...JSON.parse(raw) });
      })
      .catch(() => {}) // Unreadable storage just means no saved details
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (ready) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(profile)).catch(() => {});
  }, [profile, ready]);

  const updateProfile = useCallback((changes) => {
    setProfile((prev) => ({ ...prev, ...changes }));
  }, []);

  const clearProfile = useCallback(() => setProfile(EMPTY_PROFILE), []);

  const value = useMemo(
    () => ({ profile, ready, updateProfile, clearProfile }),
    [profile, ready, updateProfile, clearProfile]
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used inside <ProfileProvider>");
  return ctx;
}
