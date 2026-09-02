import React from "react";
import ReactDOM from "react-dom/client";
import { ConvexReactClient } from "convex/react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import App from "./App";
import "./index.css";

const convexUrl = import.meta.env.VITE_CONVEX_URL;
if (!convexUrl) {
  throw new Error("Falta VITE_CONVEX_URL en el archivo .env.local");
}

const convex = new ConvexReactClient(convexUrl);

const rootElement = document.getElementById("root");
if (rootElement === null) {
  throw new Error("No se encontró el elemento #root");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <ConvexAuthProvider client={convex}>
      <App />
    </ConvexAuthProvider>
  </React.StrictMode>,
);
