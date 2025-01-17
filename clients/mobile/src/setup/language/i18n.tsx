import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import translationEN from './locales/en/translation.json'
import translationBN from './locales/bn/translation.json'

const resources = {
  en: {
    translation: translationEN
  },
  bn: {
    translation: translationBN
  }
}

void i18n
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'bn',
    debug: true,
    interpolation: {
      escapeValue: false
    }
  })

export default i18n
