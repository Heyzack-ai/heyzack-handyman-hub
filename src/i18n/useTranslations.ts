import { useTranslation } from 'react-i18next';
import { useLanguage } from './LanguageContext';

export const useTranslations = () => {
  const { t, i18n } = useTranslation();
  const { currentLanguage, changeLanguage, isLoading } = useLanguage();

  return {
    t,
    i18n,
    currentLanguage,
    changeLanguage,
    isLoading,
  };
}; 