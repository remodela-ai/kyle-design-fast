import { createContext, useContext, ReactNode } from "react";
import { useKyleVoiceAgent } from "@/hooks/useKyleVoiceAgent";

interface KyleContextType {
  status: string;
  isSpeaking: boolean;
  isConnected: boolean;
  error: string | null;
  startConversation: () => Promise<void>;
  stopConversation: () => Promise<void>;
  toggleConversation: () => Promise<void>;
}

const KyleContext = createContext<KyleContextType | null>(null);

export function KyleProvider({ children }: { children: ReactNode }) {
  const kyle = useKyleVoiceAgent();

  return (
    <KyleContext.Provider value={kyle}>
      {children}
    </KyleContext.Provider>
  );
}

export function useKyle() {
  const context = useContext(KyleContext);
  if (!context) {
    throw new Error("useKyle must be used within a KyleProvider");
  }
  return context;
}
