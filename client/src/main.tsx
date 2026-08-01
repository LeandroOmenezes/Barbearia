import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Ignore a known Chrome extension noise that appears as an unhandled rejection in page console.
window.addEventListener("unhandledrejection", (event) => {
	const message = String(event.reason?.message ?? event.reason ?? "");
	if (message.includes("A listener indicated an asynchronous response by returning true, but the message channel closed before a response was received")) {
		event.preventDefault();
	}
});

createRoot(document.getElementById("root")!).render(<App />);
