import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ClerkProvider } from "@clerk/clerk-react";
import App from "./App.jsx";
import "./index.css";

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const missingClerkKeyScreen = (
  <main className="config-screen">
    <section className="config-panel">
      <p className="eyebrow">Configuration needed</p>
      <h1>Missing Clerk publishable key</h1>
      <p>
        Add <code>VITE_CLERK_PUBLISHABLE_KEY</code> to the frontend environment
        file and restart Vite.
      </p>
    </section>
  </main>
);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    {clerkPubKey ? (
      <ClerkProvider publishableKey={clerkPubKey}>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </ClerkProvider>
    ) : (
      missingClerkKeyScreen
    )}
  </StrictMode>,
);
