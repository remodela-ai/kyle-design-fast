import { useEffect, useRef } from "react";
import { Check, CheckCheck, Volume2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { LeadMessage } from "@/hooks/useLeads";
import kyleAvatar from "@/assets/kyle-avatar.jpeg";

interface MessageThreadProps {
  messages: LeadMessage[];
  onMarkAsRead: (messageId: string) => void;
}

const senderConfig = {
  kyle: {
    name: "Kyle",
    avatar: kyleAvatar,
    fallback: "KY",
    bgColor: "bg-blue-500/10",
    borderColor: "border-l-blue-500",
  },
  designer: {
    name: "You",
    avatar: null,
    fallback: "ME",
    bgColor: "bg-primary/10",
    borderColor: "border-l-primary",
  },
  client: {
    name: "Client",
    avatar: null,
    fallback: "CL",
    bgColor: "bg-muted",
    borderColor: "border-l-green-500",
  },
};

export function MessageThread({ messages, onMarkAsRead }: MessageThreadProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Volume2 className="w-8 h-8 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground">No messages yet</p>
        <p className="text-sm text-muted-foreground mt-1">
          Start a conversation with your client
        </p>
      </div>
    );
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
    } else if (diffDays === 1) {
      return `Yesterday ${date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}`;
    } else if (diffDays < 7) {
      return date.toLocaleDateString(undefined, { weekday: "short", hour: "2-digit", minute: "2-digit" });
    }
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
      {messages.map((message) => {
        const config = senderConfig[message.sender as keyof typeof senderConfig] || senderConfig.client;
        const isFromClient = message.sender === "client";
        const isUnread = isFromClient && !message.read_at;

        return (
          <div
            key={message.id}
            className={cn(
              "flex gap-3",
              message.sender === "designer" && "flex-row-reverse"
            )}
          >
            <Avatar className="w-8 h-8 flex-shrink-0">
              {config.avatar && <AvatarImage src={config.avatar} />}
              <AvatarFallback className="text-xs">{config.fallback}</AvatarFallback>
            </Avatar>

            <div
              className={cn(
                "flex-1 max-w-[80%]",
                message.sender === "designer" && "flex flex-col items-end"
              )}
            >
              <div
                className={cn(
                  "rounded-lg p-3 border-l-4",
                  config.bgColor,
                  config.borderColor,
                  isUnread && "ring-2 ring-primary/20"
                )}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs font-medium text-muted-foreground">
                    {config.name}
                  </span>
                  {message.sender === "kyle" && (
                    <Volume2 className="w-3 h-3 text-blue-500" />
                  )}
                </div>
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>

              <div className="flex items-center gap-2 mt-1 px-1">
                <span className="text-xs text-muted-foreground">
                  {formatTime(message.created_at)}
                </span>
                {message.sender !== "client" && (
                  message.read_at ? (
                    <CheckCheck className="w-3 h-3 text-blue-500" />
                  ) : (
                    <Check className="w-3 h-3 text-muted-foreground" />
                  )
                )}
                {isUnread && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto py-0.5 px-1.5 text-xs"
                    onClick={() => onMarkAsRead(message.id)}
                  >
                    Mark as read
                  </Button>
                )}
              </div>
            </div>
          </div>
        );
      })}
      <div ref={endRef} />
    </div>
  );
}
