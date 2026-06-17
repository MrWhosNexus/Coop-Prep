import React from "react";
import { createRoot } from "react-dom/client";
import { ProgressProvider } from "@/components/ProgressContext";
import RewardLayer from "@/components/RewardLayer";
import MobileApp from "./MobileApp";
import "./styles.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ProgressProvider>
      <MobileApp />
      <RewardLayer />
    </ProgressProvider>
  </React.StrictMode>
);
