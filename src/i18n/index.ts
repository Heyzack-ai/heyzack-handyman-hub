import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";
import AsyncStorage from "@react-native-async-storage/async-storage";
import translationFr from "./locales/fr-FR/translation.json";
import translationEn from "./locales/en-US/translation.json";

const resources = {
  "fr-FR": { translation: translationFr },
  "en-US": { translation: translationEn },
};

const initI18n = async () => {
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
};

initI18n();

export default i18n;