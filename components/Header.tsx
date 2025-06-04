import React from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";
import { ArrowLeft } from "lucide-react-native";
import Colors from "@/constants/colors";
import { useRouter } from "expo-router";

type HeaderProps = {
  title: string;
  onBack?: () => void;
};

export default function Header({ title, onBack }: HeaderProps) {
  const router = useRouter();

  const handleGoBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <View style={styles.header}>
      <Pressable onPress={handleGoBack} style={styles.backButton}>
        <ArrowLeft size={24} color={Colors.light.text} />
      </Pressable>
      <Text style={styles.headerTitle}>{title}</Text>

      <View style={{width: 24}} />
    </View>
  );
}   

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    padding: 8,
    marginLeft: -4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.light.text,
  },
});