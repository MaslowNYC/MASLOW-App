import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../../lib/supabase';

export interface AccessibilitySettings {
  reduce_animations: boolean;
  no_haptics: boolean;
  high_contrast: boolean;
  larger_text: boolean;
  screen_reader: boolean;
}

export const DEFAULT_ACCESSIBILITY_SETTINGS: AccessibilitySettings = {
  reduce_animations: false,
  no_haptics: false,
  high_contrast: false,
  larger_text: false,
  screen_reader: false,
};

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  isOnboarded: boolean;
  isLoading: boolean;
  updateSetting: (key: keyof AccessibilitySettings, value: boolean) => Promise<void>;
  updateAllSettings: (settings: AccessibilitySettings) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  resetOnboarding: () => Promise<void>;
  loadSettings: (userId: string) => Promise<void>;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

interface AccessibilityProviderProps {
  children: ReactNode;
  userId: string | null;
}

export function AccessibilityProvider({ children, userId }: AccessibilityProviderProps) {
  const [settings, setSettings] = useState<AccessibilitySettings>(DEFAULT_ACCESSIBILITY_SETTINGS);
  const [isOnboarded, setIsOnboarded] = useState(true); // Default to true to not show questionnaire unless needed
  const [isLoading, setIsLoading] = useState(true);

  // Load settings when userId changes
  useEffect(() => {
    if (userId) {
      loadSettings(userId);
    } else {
      setSettings(DEFAULT_ACCESSIBILITY_SETTINGS);
      setIsOnboarded(true);
      setIsLoading(false);
    }
  }, [userId]);

  const loadSettings = async (uid: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('accessibility_settings, accessibility_onboarded')
        .eq('id', uid)
        .single();

      if (error) {
        console.error('Error loading accessibility settings:', error);
        setIsLoading(false);
        return;
      }

      if (data?.accessibility_settings) {
        setSettings({
          ...DEFAULT_ACCESSIBILITY_SETTINGS,
          ...data.accessibility_settings,
        });
      }

      // If accessibility_onboarded is null or false, show questionnaire
      setIsOnboarded(data?.accessibility_onboarded === true);
    } catch (error) {
      console.error('Error loading accessibility settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSetting = async (key: keyof AccessibilitySettings, value: boolean) => {
    if (!userId) return;

    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    try {
      await supabase
        .from('profiles')
        .update({ accessibility_settings: newSettings })
        .eq('id', userId);
    } catch (error) {
      console.error('Error saving accessibility setting:', error);
    }
  };

  const updateAllSettings = async (newSettings: AccessibilitySettings) => {
    if (!userId) return;

    setSettings(newSettings);

    try {
      await supabase
        .from('profiles')
        .update({ accessibility_settings: newSettings })
        .eq('id', userId);
    } catch (error) {
      console.error('Error saving accessibility settings:', error);
    }
  };

  const completeOnboarding = async () => {
    if (!userId) return;

    setIsOnboarded(true);

    try {
      await supabase
        .from('profiles')
        .update({
          accessibility_settings: settings,
          accessibility_onboarded: true,
        })
        .eq('id', userId);
    } catch (error) {
      console.error('Error completing accessibility onboarding:', error);
    }
  };

  const resetOnboarding = async () => {
    if (!userId) return;

    setIsOnboarded(false);
    setSettings(DEFAULT_ACCESSIBILITY_SETTINGS);

    try {
      await supabase
        .from('profiles')
        .update({
          accessibility_settings: DEFAULT_ACCESSIBILITY_SETTINGS,
          accessibility_onboarded: false,
        })
        .eq('id', userId);
    } catch (error) {
      console.error('Error resetting accessibility onboarding:', error);
    }
  };

  return (
    <AccessibilityContext.Provider
      value={{
        settings,
        isOnboarded,
        isLoading,
        updateSetting,
        updateAllSettings,
        completeOnboarding,
        resetOnboarding,
        loadSettings,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
}

// Hook for haptics that respects accessibility settings
export function useAccessibleHaptics() {
  const context = useContext(AccessibilityContext);
  const noHaptics = context?.settings.no_haptics ?? false;

  return {
    isDisabled: noHaptics,
    shouldVibrate: !noHaptics,
  };
}
