import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import AlertProvider from "./Components/Alert/AlertProvider.jsx";

createRoot(document.getElementById("root")).render(
  <AlertProvider>
    <App />
  </AlertProvider>,
);
