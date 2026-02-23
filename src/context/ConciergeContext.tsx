import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CONCIERGE_HIDDEN_KEY = 'maslow_concierge_hidden';

interface ConciergeContextType {
  isVisible: boolean;
  setIsVisible: (visible: boolean) => Promise<void>;
  toggleVisibility: () => Promise<void>;
}

const ConciergeContext = createContext<ConciergeContextType | undefined>(undefined);

interface ConciergeProviderProps {
  children: ReactNode;
}

export function ConciergeProvider({ children }: ConciergeProviderProps) {
  const [isVisible, setIsVisibleState] = useState(true);

  // Load initial state from AsyncStorage
  useEffect(() => {
    loadState();
  }, []);

  const loadState = async () => {
    try {
      const hidden = await AsyncStorage.getItem(CONCIERGE_HIDDEN_KEY);
      setIsVisibleState(hidden !== 'true');
    } catch (error) {
      console.error('Error loading concierge state:', error);
    }
  };

  const setIsVisible = async (visible: boolean) => {
    setIsVisibleState(visible);
    try {
      if (visible) {
        await AsyncStorage.removeItem(CONCIERGE_HIDDEN_KEY);
      } else {
        await AsyncStorage.setItem(CONCIERGE_HIDDEN_KEY, 'true');
      }
    } catch (error) {
      console.error('Error saving concierge state:', error);
    }
  };

  const toggleVisibility = async () => {
    await setIsVisible(!isVisible);
  };

  return (
    <ConciergeContext.Provider value={{ isVisible, setIsVisible, toggleVisibility }}>
      {children}
    </ConciergeContext.Provider>
  );
}

export function useConcierge() {
  const context = useContext(ConciergeContext);
  if (context === undefined) {
    throw new Error('useConcierge must be used within a ConciergeProvider');
  }
  return context;
}
