import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import { AuthProvider } from "./context/AuthContext"; // ✅ Import


createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
     <AuthProvider>
      <App />
     </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
