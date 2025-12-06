import { useKyle, ConversationMessage } from "@/contexts/KyleContext";
import { MessageSquare, Sparkles, Trash2, Loader2, Mic } from "lucide-react";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";

interface ConversationSummaryProps {
  onUseAsPrompt?: (prompt: string) => void;
}

export function ConversationSummary({ onUseAsPrompt }: ConversationSummaryProps) {
  const { messages, designSummary, clearMessages, isConnected, voiceCommandDetected, isGeneratingFromVoice } = useKyle();

  if (messages.length === 0 && !voiceCommandDetected && !isGeneratingFromVoice) {
    return null;
  }

  // Generate a prompt from the conversation
  const generatePromptFromConversation = () => {
    const userMessages = messages
      .filter(m => m.role === "user")
      .map(m => m.content)
      .join(". ");
    
    if (userMessages && onUseAsPrompt) {
      onUseAsPrompt(userMessages);
    }
  };

  return (
    <div className="w-full max-w-2xl bg-card rounded-2xl border border-border p-4 md:p-6 shadow-lg shadow-primary/5 dark:shadow-[0_0_20px_rgba(220,38,38,0.15)] transition-all duration-300 mb-6">
      {/* Voice Command Detected Banner */}
      {voiceCommandDetected && (
        <div className="mb-4 p-4 rounded-xl bg-primary border border-primary animate-pulse">
          <div className="flex items-center gap-3">
            <Mic className="h-5 w-5 text-white animate-bounce" />
            <span className="text-white font-bold uppercase tracking-wider">
              Voice Command Detected
            </span>
          </div>
        </div>
      )}

      {/* Kyle Working Banner */}
      {isGeneratingFromVoice && (
        <div className="mb-4 p-4 rounded-xl bg-gradient-to-r from-primary to-primary/80 border border-primary">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 text-white animate-spin" />
            <span className="text-white font-semibold">
              Kyle is working now...
            </span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">
            Conversation with Kyle
          </h3>
          {isConnected && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Live
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearMessages}
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Design Summary */}
      {designSummary && (
        <div className="mb-4 p-3 rounded-xl bg-primary/10 border border-primary/20">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Design Summary</span>
          </div>
          <p className="text-sm text-muted-foreground">{designSummary}</p>
          {onUseAsPrompt && (
            <Button
              variant="outline"
              size="sm"
              onClick={generatePromptFromConversation}
              className="mt-3 w-full border-primary/30 hover:border-primary hover:bg-primary/10 shadow-lg shadow-primary/10 dark:shadow-[0_0_10px_rgba(220,38,38,0.2)]"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Use as Image Prompt
            </Button>
          )}
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="h-48 pr-4">
        <div className="space-y-3">
          {messages.map((message, index) => (
            <MessageBubble key={index} message={message} />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

function MessageBubble({ message }: { message: ConversationMessage }) {
  const isUser = message.role === "user";
  
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
          isUser
            ? "bg-primary text-primary-foreground rounded-br-md"
            : "bg-muted text-foreground rounded-bl-md"
        }`}
      >
        <p>{message.content}</p>
        <span className="text-[10px] opacity-60 mt-1 block">
          {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>
    </div>
  );
}
