import React, { useState, useRef, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  Alert,
  ScrollView,
  SafeAreaView,
  Keyboard,
  Platform,
  StatusBar,
} from "react-native";
import Slider from '@react-native-community/slider';
import { Stack, useRouter } from "expo-router";
import { MapPin, Search } from "lucide-react-native";
import Colors from "@/constants/colors";
import Header from "@/components/Header";
import { useAddArea, useGetArea } from "../api/user/addArea";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

export default function ServiceAreaScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [zipCode, setZipCode] = useState("94105");
  const [radius, setRadius] = useState(25);
  const [radiusInput, setRadiusInput] = useState("25");
  const [isSaving, setIsSaving] = useState(false);
  const [isCustomRadius, setIsCustomRadius] = useState(false);
  const { data: areaData, isLoading } = useGetArea();
  const queryClient = useQueryClient();
  useEffect(() => {
    
    if (areaData?.data?.current_location) {
      setZipCode(areaData.data.current_location);
    }
    if (areaData?.data?.service_area) {
      setRadius(areaData.data.service_area);
    }
  }, [areaData]);

  // Min and max radius values
  const MIN_RADIUS = 5;
  const MAX_RADIUS = 50;

  // Update radiusInput when radius changes from slider
  useEffect(() => {
    setRadiusInput(radius.toString());
  }, [radius]);

  // Handle direct input of radius value
  const handleRadiusInputChange = (text: string) => {
    // Allow only numbers
    const numericValue = text.replace(/[^0-9]/g, '');
    setRadiusInput(numericValue);
  };

  const handleRadiusInputBlur = () => {
    // Convert to number and ensure within bounds
    let numValue = parseInt(radiusInput, 10);
    
    // Handle invalid or empty input
    if (isNaN(numValue)) {
      numValue = radius;
      setRadiusInput(radius.toString());
      return;
    }
    
    // Ensure within bounds
    numValue = Math.max(MIN_RADIUS, Math.min(MAX_RADIUS, numValue));
    
    // Update radius and input
    setRadius(numValue);
    setRadiusInput(numValue.toString());
    
    // Check if it's a preset value
    const isPreset = [10, 25, 50].includes(numValue);
    setIsCustomRadius(!isPreset);
  };

  // Handle preset button press
  const handlePresetPress = (value: number) => {
    setRadius(value);
    setRadiusInput(value.toString());
    setIsCustomRadius(false);
  };

  const handleSearch = () => {
    // In a real app, this would validate the zipcode and update the map
    Alert.alert(t("serviceArea.search"), `${t("serviceArea.searchingForLocationWithZipcode")} ${zipCode}`);
  };

  const { mutate, error, isPending } = useAddArea(zipCode, radius);
  const handleSave = () => {
    setIsSaving(true);
    
    mutate(undefined, {
      onSuccess: () => {
        setIsSaving(false);
        queryClient.invalidateQueries({ queryKey: ["get-area"] });
        Alert.alert(t("serviceArea.success"), t("serviceArea.serviceAreaUpdatedSuccessfully"));
        router.back();
      },
      onError: (error) => {
        setIsSaving(false);
        Alert.alert(t("serviceArea.error"), error instanceof Error ? error.message : t("serviceArea.failedToUpdateServiceArea"));
      },
    });


  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={{ flex: 1 }}>
        <Header title={t("serviceArea.serviceArea")} onBack={() => router.back()} />
        <ScrollView 
          style={styles.container} 
          contentContainerStyle={styles.content} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.description}>
            {t("serviceArea.setServiceAreaDescription")}
          </Text>
          
          <View style={styles.searchContainer}>
            <View style={styles.inputContainer}>
              <MapPin size={20} color={Colors.light.gray[500]} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={zipCode}
                onChangeText={setZipCode}
                placeholder={t("serviceArea.enterZipCode")}
                keyboardType="number-pad"
              />
            </View>
            
            <Pressable style={styles.searchButton} onPress={handleSearch}>
              <Search size={20} color="white" />
            </Pressable>
          </View>
          
          {/* <View style={styles.mapPlaceholder}>
            <Text style={styles.mapPlaceholderText}>
              Map would be displayed here in a real app
            </Text>
            <Text style={styles.mapPlaceholderSubtext}>
              Service area: {zipCode} ({radius} km radius)
            </Text>
          </View> */}
          
          <View style={styles.radiusContainer}>
            <View style={styles.radiusLabelContainer}>
              <Text style={styles.radiusLabel}>{t("serviceArea.serviceRadius")}:</Text>
              <View style={styles.radiusInputContainer}>
                <TextInput
                  style={styles.radiusInputField}
                  value={radiusInput}
                  onChangeText={handleRadiusInputChange}
                  onBlur={handleRadiusInputBlur}
                  keyboardType="number-pad"
                  maxLength={2}
                  selectTextOnFocus
                />
                <Text style={styles.radiusUnit}>km</Text>
              </View>
              {isCustomRadius && <Text style={styles.customLabel}>(Custom)</Text>}
            </View>
            
            <View style={styles.sliderContainer}>
              <Text style={styles.sliderLabel}>{MIN_RADIUS}</Text>
              <Slider
                style={styles.slider}
                minimumValue={MIN_RADIUS}
                maximumValue={MAX_RADIUS}
                value={radius}
                onValueChange={(value) => {
                  setRadius(Math.round(value));
                  const isPreset = [10, 25, 50].includes(Math.round(value));
                  setIsCustomRadius(!isPreset);
                }}
                minimumTrackTintColor={Colors.light.primary}
                maximumTrackTintColor={Colors.light.gray[300]}
                thumbTintColor={Colors.light.primary}
                step={1}
              />
              <Text style={styles.sliderLabel}>{MAX_RADIUS}</Text>
            </View>
            
            <Text style={styles.presetLabel}>{t("serviceArea.presetRadiusOptions")}</Text>
            <View style={styles.radiusButtons}>
              {[10, 25, 50].map((value) => (
                <Pressable
                  key={value}
                  style={[
                    styles.radiusButton,
                    radius === value && styles.radiusButtonActive,
                  ]}
                  onPress={() => handlePresetPress(value)}
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
            <Text style={styles.infoTitle}>{t("serviceArea.aboutServiceArea")}</Text>
            <Text style={styles.infoText}>
              {t("serviceArea.aboutServiceAreaDescription")}
            </Text>
            <Text style={styles.infoText}>
              {t("serviceArea.aboutServiceAreaDescription2")}
            </Text>
            <Text style={styles.infoText}>
              {t("serviceArea.aboutServiceAreaDescription3")}
            </Text>
            <Text style={styles.infoText}>
              {t("serviceArea.aboutServiceAreaDescription4")}
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
              {isSaving ? t("serviceArea.saving") : t("serviceArea.saveServiceArea")}
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    backgroundColor: Colors.light.background,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
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
  radiusLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  radiusLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.text,
  },
  radiusInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 6,
    paddingHorizontal: 8,
    backgroundColor: 'white',
  },
  radiusInputField: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.primary,
    width: 40,
    padding: 4,
    textAlign: 'center',
  },
  radiusUnit: {
    fontSize: 16,
    color: Colors.light.gray[600],
    marginLeft: 2,
  },
  customLabel: {
    fontSize: 14,
    color: Colors.light.primary,
    marginLeft: 8,
    fontStyle: 'italic',
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
    height: 40,
    marginHorizontal: 8,
  },
  presetLabel: {
    fontSize: 14,
    color: Colors.light.gray[600],
    marginBottom: 8,
    marginTop: 16,
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
