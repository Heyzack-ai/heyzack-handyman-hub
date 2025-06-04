import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  Alert,
  ScrollView,
  SafeAreaView,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { MapPin, Search } from "lucide-react-native";
import Colors from "@/constants/colors";

export default function ServiceAreaScreen() {
  const router = useRouter();
  const [zipCode, setZipCode] = useState("94105");
  const [radius, setRadius] = useState(25);
  const [isSaving, setIsSaving] = useState(false);

  const handleSearch = () => {
    // In a real app, this would validate the zipcode and update the map
    Alert.alert("Search", `Searching for location with zipcode: ${zipCode}`);
  };

  const handleSave = () => {
    setIsSaving(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      Alert.alert("Success", "Service area updated successfully");
      router.back();
    }, 1000);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ title: "Service Area" }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.description}>
          Set your service area to define where you're available to work. This helps match you with nearby jobs.
        </Text>
        
        <View style={styles.searchContainer}>
          <View style={styles.inputContainer}>
            <MapPin size={20} color={Colors.light.gray[500]} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={zipCode}
              onChangeText={setZipCode}
              placeholder="Enter ZIP code"
              keyboardType="number-pad"
            />
          </View>
          
          <Pressable style={styles.searchButton} onPress={handleSearch}>
            <Search size={20} color="white" />
          </Pressable>
        </View>
        
        <View style={styles.mapPlaceholder}>
          <Text style={styles.mapPlaceholderText}>
            Map would be displayed here in a real app
          </Text>
          <Text style={styles.mapPlaceholderSubtext}>
            Service area: {zipCode} ({radius} km radius)
          </Text>
        </View>
        
        <View style={styles.radiusContainer}>
          <Text style={styles.radiusLabel}>Service Radius: {radius} km</Text>
          <View style={styles.sliderContainer}>
            <Text style={styles.sliderLabel}>5</Text>
            <View style={styles.slider}>
              <View style={[styles.sliderTrack, { width: `${(radius - 5) / 45 * 100}%` }]} />
              <Pressable
                style={[styles.sliderThumb, { left: `${(radius - 5) / 45 * 100}%` }]}
                onPress={() => {
                  // In a real app, this would be a draggable slider
                }}
              />
            </View>
            <Text style={styles.sliderLabel}>50</Text>
          </View>
          
          <View style={styles.radiusButtons}>
            {[10, 25, 50].map((value) => (
              <Pressable
                key={value}
                style={[
                  styles.radiusButton,
                  radius === value && styles.radiusButtonActive,
                ]}
                onPress={() => setRadius(value)}
              >
                <Text
                  style={[
                    styles.radiusButtonText,
                    radius === value && styles.radiusButtonTextActive,
                  ]}
                >
                  {value} km
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
        
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>About Service Areas</Text>
          <Text style={styles.infoText}>
            • Your service area determines which job requests you'll receive.
          </Text>
          <Text style={styles.infoText}>
            • A larger radius means more potential jobs but longer travel times.
          </Text>
          <Text style={styles.infoText}>
            • You can update your service area at any time.
          </Text>
        </View>
      </ScrollView>
      
      <View style={styles.footer}>
        <Pressable
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isSaving}
        >
          <Text style={styles.saveButtonText}>
            {isSaving ? "Saving..." : "Save Service Area"}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 80,
  },
  description: {
    fontSize: 16,
    color: Colors.light.gray[600],
    marginBottom: 24,
  },
  searchContainer: {
    flexDirection: "row",
    marginBottom: 16,
  },
  inputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    marginRight: 8,
  },
  inputIcon: {
    marginLeft: 12,
  },
  input: {
    flex: 1,
    height: 50,
    paddingHorizontal: 12,
    fontSize: 16,
    color: Colors.light.text,
  },
  searchButton: {
    width: 50,
    height: 50,
    backgroundColor: Colors.light.primary,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  mapPlaceholder: {
    height: 200,
    backgroundColor: Colors.light.gray[200],
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  mapPlaceholderText: {
    fontSize: 16,
    fontWeight: "500",
    color: Colors.light.gray[600],
  },
  mapPlaceholderSubtext: {
    fontSize: 14,
    color: Colors.light.gray[500],
    marginTop: 8,
  },
  radiusContainer: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  radiusLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.text,
    marginBottom: 16,
  },
  sliderContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  sliderLabel: {
    fontSize: 14,
    color: Colors.light.gray[600],
    width: 24,
    textAlign: "center",
  },
  slider: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.light.gray[300],
    borderRadius: 2,
    marginHorizontal: 8,
    position: "relative",
  },
  sliderTrack: {
    height: 4,
    backgroundColor: Colors.light.primary,
    borderRadius: 2,
    position: "absolute",
    left: 0,
  },
  sliderThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.light.primary,
    position: "absolute",
    top: -8,
    marginLeft: -10,
    borderWidth: 2,
    borderColor: "white",
  },
  radiusButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  radiusButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: "white",
  },
  radiusButtonActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  radiusButtonText: {
    fontSize: 14,
    color: Colors.light.text,
  },
  radiusButtonTextActive: {
    color: "white",
    fontWeight: "500",
  },
  infoBox: {
    backgroundColor: Colors.light.primary + "10",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.primary,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: Colors.light.gray[700],
    marginBottom: 4,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  saveButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: "center",
  },
  saveButtonDisabled: {
    backgroundColor: Colors.light.gray[400],
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
});
