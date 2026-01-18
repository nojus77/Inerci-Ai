"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface CalContextType {
  isOpen: boolean;
  openCalModal: () => void;
  closeCalModal: () => void;
}

const CalContext = createContext<CalContextType | null>(null);

// Cal.com booking configuration
const CAL_LINK = "inerci-ai/nemokamas-automatizacijos-auditas";
const CAL_NAMESPACE = "nemokamas-automatizacijos-auditas";

export function useCalModal() {
  const context = useContext(CalContext);
  if (!context) {
    throw new Error("useCalModal must be used within CalProvider");
  }
  return context;
}

export function CalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const openCalModal = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeCalModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <CalContext.Provider value={{ isOpen, openCalModal, closeCalModal }}>
      {children}
    </CalContext.Provider>
  );
}

// Export config for use in CalModal
export { CAL_LINK, CAL_NAMESPACE };
