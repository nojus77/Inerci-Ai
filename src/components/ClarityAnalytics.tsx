"use client";

import { useEffect } from "react";
import Clarity from "@microsoft/clarity";

const projectId = "v4nh6k3rm1";

export default function ClarityAnalytics() {
  useEffect(() => {
    Clarity.init(projectId);
  }, []);

  return null;
}
