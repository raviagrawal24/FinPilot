"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { getTranslation, Language } from "@/lib/i18n";

export type Theme = "dark" | "light";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
  healthScore?: number;
  monthlyIncome?: number;
}

interface AppContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  user: UserProfile | null;
  setUser: (user: UserProfile | null) => void;
  refreshUser: () => Promise<UserProfile | null>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const THEME_KEY = "finpilot_theme";
const LANG_KEY = "finpilot_language";

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");
  const [language, setLanguageState] = useState<Language>("en");
  const [user, setUserState] = useState<UserProfile | null>(null);
  const [mounted, setMounted] = useState(false);

  const fetchUser = async (): Promise<UserProfile | null> => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const json = await res.json();
        if (json?.user) {
          setUserState(json.user);
          return json.user;
        }
      }
    } catch (e) {
      console.error("Failed to fetch current user context:", e);
    }
    return null;
  };

  useEffect(() => {
    // Load persisted theme & language from localStorage
    const savedTheme = localStorage.getItem(THEME_KEY) as Theme | null;
    const savedLang = localStorage.getItem(LANG_KEY) as Language | null;

    if (savedTheme === "light" || savedTheme === "dark") {
      setThemeState(savedTheme);
      applyThemeToDOM(savedTheme);
    } else {
      applyThemeToDOM("dark");
    }

    if (savedLang === "en" || savedLang === "hi") {
      setLanguageState(savedLang);
    }

    fetchUser();
    setMounted(true);
  }, []);

  const applyThemeToDOM = (newTheme: Theme) => {
    const root = document.documentElement;
    if (newTheme === "light") {
      root.classList.remove("dark");
      root.classList.add("light");
    } else {
      root.classList.remove("light");
      root.classList.add("dark");
    }
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem(THEME_KEY, newTheme);
    applyThemeToDOM(newTheme);
  };

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
  };

  const setLanguage = (newLang: Language) => {
    setLanguageState(newLang);
    localStorage.setItem(LANG_KEY, newLang);
  };

  const setUser = (newUser: UserProfile | null) => {
    setUserState(newUser);
  };

  const t = (key: string): string => {
    return getTranslation(language, key);
  };

  return (
    <AppContext.Provider
      value={{
        theme,
        setTheme,
        toggleTheme,
        language,
        setLanguage,
        t,
        user,
        setUser,
        refreshUser: fetchUser,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}

export function useTranslation() {
  const { t, language, setLanguage } = useApp();
  return { t, language, setLanguage };
}

