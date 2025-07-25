import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import * as Localization from 'expo-localization';

interface LanguageContextType {
  currentLanguage: string;
  changeLanguage: (language: string) => Promise<void>;
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const { i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState('fr-FR');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeLanguage = async () => {
      try {
        // Try to get saved language from storage
        const savedLanguage = await AsyncStorage.getItem('language');
        
        if (savedLanguage) {
          setCurrentLanguage(savedLanguage);
          await i18n.changeLanguage(savedLanguage);
        } else {
          // Use device locale or default to French
          const deviceLocale = Localization.getLocales()[0]?.languageTag;
          const defaultLanguage = deviceLocale?.startsWith('fr') ? 'fr-FR' : 'en-US';
          
          setCurrentLanguage(defaultLanguage);
          await i18n.changeLanguage(defaultLanguage);
          await AsyncStorage.setItem('language', defaultLanguage);
        }
      } catch (error) {
        console.error('Error initializing language:', error);
        // Fallback to French
        setCurrentLanguage('fr-FR');
        await i18n.changeLanguage('fr-FR');
      } finally {
        setIsLoading(false);
      }
    };

    initializeLanguage();
  }, [i18n]);

  const changeLanguage = async (language: string) => {
    try {
      setIsLoading(true);
      await AsyncStorage.setItem('language', language);
      await i18n.changeLanguage(language);
      setCurrentLanguage(language);
    } catch (error) {
      console.error('Error changing language:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LanguageContext.Provider value={{ currentLanguage, changeLanguage, isLoading }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}; 