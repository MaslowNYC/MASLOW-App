import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import {
  LanguageCode,
  setLanguage,
  saveLanguagePreference,
  initializeLanguage,
  getCurrentLanguage,
} from '../i18n';

interface LanguageContextType {
  language: LanguageCode;
  changeLanguage: (code: LanguageCode) => Promise<LanguageCode>;
  revertLanguage: () => Promise<void>;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
  userId: string | null;
}

export function LanguageProvider({ children, userId }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<LanguageCode>(getCurrentLanguage());
  const previousLanguageRef = useRef<LanguageCode>(language);
  const userIdRef = useRef<string | null>(userId);

  // Keep userId ref updated
  useEffect(() => {
    userIdRef.current = userId;
  }, [userId]);

  // Initialize language on mount
  useEffect(() => {
    const init = async () => {
      const initializedLang = await initializeLanguage(userId ?? undefined);
      setLanguageState(initializedLang);
      previousLanguageRef.current = initializedLang;
    };
    init();
  }, [userId]);

  const changeLanguage = async (code: LanguageCode): Promise<LanguageCode> => {
    // Store previous language
    const prevLang = language;
    previousLanguageRef.current = prevLang;

    // Update i18n
    setLanguage(code);

    // Update state (triggers re-renders app-wide)
    setLanguageState(code);

    // Save preference if user is logged in
    if (userIdRef.current) {
      await saveLanguagePreference(userIdRef.current, code);
    }

    // Return previous language so callers can undo
    return prevLang;
  };

  const revertLanguage = async (): Promise<void> => {
    const prevLang = previousLanguageRef.current;

    // Update i18n
    setLanguage(prevLang);

    // Update state
    setLanguageState(prevLang);

    // Save preference if user is logged in
    if (userIdRef.current) {
      await saveLanguagePreference(userIdRef.current, prevLang);
    }
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, revertLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
