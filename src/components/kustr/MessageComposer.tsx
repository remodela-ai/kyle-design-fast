import { useState } from "react";
import { Send, Volume2, Mail, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface MessageComposerProps {
  leadId: string;
  leadEmail: string | null;
  onMessageSent: () => void;
}

export function MessageComposer({ leadId, leadEmail, onMessageSent }: MessageComposerProps) {
  const [content, setContent] = useState("");
  const [sendViaKyle, setSendViaKyle] = useState(false);
  const [sendEmail, setSendEmail] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  const handleSend = async () => {
    if (!content.trim()) return;

    setIsSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("kyle-send-message", {
        body: {
          lead_id: leadId,
          content: content.trim(),
          sender: sendViaKyle ? "kyle" : "designer",
          send_email: sendEmail && !!leadEmail,
          use_tts: sendViaKyle,
        },
      });

      if (error) throw error;

      toast({
        title: "Message sent",
        description: data.email_sent 
          ? "Message sent and email delivered to client" 
          : sendViaKyle 
            ? "Message queued for Kyle to deliver" 
            : "Message stored successfully",
      });

      setContent("");
      onMessageSent();
    } catch (error) {
      console.error("Failed to send message:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handleSend();
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Textarea
          placeholder="Type your message to the client..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={4}
          className="resize-none pr-12"
        />
        <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
          ⌘+Enter to send
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Switch
            id="send-kyle"
            checked={sendViaKyle}
            onCheckedChange={setSendViaKyle}
          />
          <Label htmlFor="send-kyle" className="flex items-center gap-1.5 cursor-pointer">
            <Volume2 className="w-4 h-4 text-blue-500" />
            Send via Kyle
          </Label>
          {sendViaKyle && (
            <Badge variant="secondary" className="text-xs">TTS enabled</Badge>
          )}
        </div>

        {leadEmail && (
          <div className="flex items-center gap-2">
            <Switch
              id="send-email"
              checked={sendEmail}
              onCheckedChange={setSendEmail}
            />
            <Label htmlFor="send-email" className="flex items-center gap-1.5 cursor-pointer">
              <Mail className="w-4 h-4 text-green-500" />
              Send email
            </Label>
          </div>
        )}
      </div>

      <Button
        onClick={handleSend}
        disabled={isSending || !content.trim()}
        className="w-full gap-2"
      >
        {isSending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Sending...
          </>
        ) : (
          <>
            <Send className="w-4 h-4" />
            {sendViaKyle ? "Send via Kyle" : "Send Message"}
          </>
        )}
      </Button>
    </div>
  );
}
