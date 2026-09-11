import { en } from "./en";
import { hi } from "./hi";

export type Language = "en" | "hi";

export const translations = {
  en,
  hi,
};

// Helper function to resolve nested keys like "dashboard.title"
export function getTranslation(lang: Language, path: string): string {
  const dictionary = translations[lang] || translations.en;
  const keys = path.split(".");
  let current: any = dictionary;

  for (const key of keys) {
    if (current && typeof current === "object" && key in current) {
      current = current[key];
    } else {
      // Fallback to English if key missing in target language
      let fallback: any = translations.en;
      for (const fk of keys) {
        if (fallback && typeof fallback === "object" && fk in fallback) {
          fallback = fallback[fk];
        } else {
          return path;
        }
      }
      return typeof fallback === "string" ? fallback : path;
    }
  }

  return typeof current === "string" ? current : path;
}
