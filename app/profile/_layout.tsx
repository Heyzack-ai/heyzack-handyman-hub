import React from "react";
import { Stack } from "expo-router";

export default function ProfileLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerBackTitle: "Back",
        contentStyle: { backgroundColor: Colors.light.background },
      }}
    />
  );
}

import Colors from "@/constants/colors";