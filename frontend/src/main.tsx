import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

// Prevent Vidstack provider teardown unhandled promise rejection from crashing React
window.addEventListener("unhandledrejection", (event) => {
  const reason = event.reason;
  const msg = reason?.message || String(reason || "");
  if (msg.includes("provider destroyed")) {
    event.preventDefault();
  }
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
