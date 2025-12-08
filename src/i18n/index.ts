import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import translationFr from "./locales/fr-FR/translation.json";
import translationEn from "./locales/en-US/translation.json";

const resources = {
  "fr-FR": { translation: translationFr },
  "en-US": { translation: translationEn },
};

// Check if we're in a Node.js/server environment
const isServerEnvironment = typeof window === "undefined" && typeof process !== "undefined" && process.versions?.node;

const initI18n = async () => {
  // Skip AsyncStorage in server environments (build time)
  if (isServerEnvironment) {
    i18n.use(initReactI18next).init({
      resources,
      lng: "fr-FR",
      fallbackLng: "fr-FR",
      interpolation: {
        escapeValue: false,
      },
    });
    return;
  }

  // Client-side initialization with AsyncStorage
  try {
    const AsyncStorage = require("@react-native-async-storage/async-storage").default;
    const Localization = require("expo-localization");
    
    let savedLanguage = await AsyncStorage.getItem("language");

    if (!savedLanguage) {
      savedLanguage = Localization.getLocales()[0]?.languageTag || "fr-FR";
    }

    i18n.use(initReactI18next).init({
      resources,
      lng: savedLanguage,
      fallbackLng: "fr-FR",
      interpolation: {
        escapeValue: false,
      },
    });
  } catch (error) {
    // Fallback initialization if AsyncStorage fails
    i18n.use(initReactI18next).init({
      resources,
      lng: "fr-FR",
      fallbackLng: "fr-FR",
      interpolation: {
        escapeValue: false,
      },
    });
  }
};

// Only initialize if not already initialized
// Wrap in try-catch to handle any edge cases during build
if (!i18n.isInitialized) {
  try {
    initI18n();
  } catch (error) {
    // Fallback: initialize with default language if anything fails
    i18n.use(initReactI18next).init({
      resources,
      lng: "fr-FR",
      fallbackLng: "fr-FR",
      interpolation: {
        escapeValue: false,
      },
    });
  }
}

export default i18n;