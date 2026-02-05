import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Set light mode as default if no preference is saved
if (!localStorage.getItem("theme")) {
  document.documentElement.classList.remove("dark");
  document.documentElement.classList.add("light");
}

createRoot(document.getElementById("root")!).render(<App />);
