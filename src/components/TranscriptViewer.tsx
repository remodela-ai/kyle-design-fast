import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, User, Bot } from "lucide-react";

interface TranscriptViewerProps {
  transcript: string;
  source?: "voice" | "pdf";
  className?: string;
}

export function TranscriptViewer({ transcript, source = "voice", className = "" }: TranscriptViewerProps) {
  // Parse transcript into messages
  const parseTranscript = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim());
    const messages: { role: "kyle" | "client"; content: string }[] = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("Kyle:") || trimmed.startsWith("Assistant:")) {
        messages.push({
          role: "kyle",
          content: trimmed.replace(/^(Kyle:|Assistant:)\s*/, "")
        });
      } else if (trimmed.startsWith("Client:") || trimmed.startsWith("User:") || trimmed.startsWith("user:")) {
        messages.push({
          role: "client",
          content: trimmed.replace(/^(Client:|User:|user:)\s*/, "")
        });
      } else if (messages.length > 0) {
        // Continuation of previous message
        messages[messages.length - 1].content += " " + trimmed;
      } else {
        // Standalone text, treat as client
        messages.push({ role: "client", content: trimmed });
      }
    }
    
    return messages;
  };

  const messages = parseTranscript(transcript);

  if (!transcript || transcript.trim() === "") {
    return (
      <div className={`flex flex-col items-center justify-center py-8 text-muted-foreground ${className}`}>
        <FileText className="h-8 w-8 mb-2 opacity-50" />
        <p className="text-sm">No conversation transcript available</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex items-center gap-2 mb-3">
        <FileText className="h-4 w-4 text-primary" />
        <h3 className="font-semibold text-sm">Conversation Transcript</h3>
        <span className="text-xs text-muted-foreground px-2 py-0.5 rounded-full bg-muted">
          {source === "pdf" ? "PDF Upload" : "Voice"}
        </span>
      </div>
      
      <ScrollArea className="h-[300px] rounded-lg border border-border bg-muted/30 p-4">
        <div className="space-y-4">
          {messages.map((msg, index) => (
            <div 
              key={index}
              className={`flex gap-3 ${msg.role === "kyle" ? "" : "flex-row-reverse"}`}
            >
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                msg.role === "kyle" 
                  ? "bg-primary/10 text-primary" 
                  : "bg-secondary text-secondary-foreground"
              }`}>
                {msg.role === "kyle" ? (
                  <Bot className="h-4 w-4" />
                ) : (
                  <User className="h-4 w-4" />
                )}
              </div>
              <div className={`flex-1 max-w-[80%] ${msg.role === "kyle" ? "" : "text-right"}`}>
                <p className="text-xs text-muted-foreground mb-1">
                  {msg.role === "kyle" ? "Kyle" : "Client"}
                </p>
                <div className={`inline-block rounded-lg px-3 py-2 text-sm ${
                  msg.role === "kyle"
                    ? "bg-card border border-border"
                    : "bg-primary/10 text-foreground"
                }`}>
                  {msg.content}
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
