"use client";

import { CalProvider, CAL_LINK, CAL_NAMESPACE, useCalModal } from "./CalContext";
import CalModal from "./CalModal";
import { ReactNode } from "react";

function CalModalRenderer() {
  const { isOpen, closeCalModal } = useCalModal();

  return (
    <CalModal
      open={isOpen}
      onClose={closeCalModal}
      calLink={CAL_LINK}
      namespace={CAL_NAMESPACE}
    />
  );
}

export default function CalWrapper({ children }: { children: ReactNode }) {
  return (
    <CalProvider>
      {children}
      <CalModalRenderer />
    </CalProvider>
  );
}
