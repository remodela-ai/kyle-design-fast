import { useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mic, MicOff, Phone, Sparkles } from "lucide-react";
import { useKyleLeadAgent } from "@/hooks/useKyleLeadAgent";
import { useToast } from "@/hooks/use-toast";
import { AudioWaves } from "@/components/AudioWaves";

export default function KylePublic() {
  const [searchParams] = useSearchParams();
  const officeId = searchParams.get('office') || '';
  const { toast } = useToast();
  
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactInfo, setContactInfo] = useState({ name: '', email: '', phone: '' });
  const [leadCaptured, setLeadCaptured] = useState(false);

  const handleLeadCaptured = useCallback((leadId: string) => {
    console.log("Lead captured with ID:", leadId);
    setLeadCaptured(true);
    toast({
      title: "Thank you!",
      description: "We've received your design inquiry. Our team will be in touch soon!",
    });
  }, [toast]);

  const {
    status,
    isSpeaking,
    isConnected,
    error,
    toggleConversation,
    captureLead,
  } = useKyleLeadAgent({
    officeId,
    onLeadCaptured: handleLeadCaptured,
  });

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await captureLead(contactInfo);
    setShowContactForm(false);
  };

  if (leadCaptured) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/10 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8 pb-8">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-4">
              Thank You!
            </h1>
            <p className="text-muted-foreground mb-6">
              We've captured your design vision. Our team will review your requirements and reach out to discuss your project in detail.
            </p>
            <Button onClick={() => window.location.reload()}>
              Start New Conversation
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/10 flex flex-col">
      {/* Header */}
      <header className="p-4 border-b border-border/50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <span className="text-primary-foreground font-bold">K</span>
            </div>
            <div>
              <h1 className="font-semibold text-foreground">Kyle</h1>
              <p className="text-xs text-muted-foreground">Design Consultant</p>
            </div>
          </div>
          {isConnected && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              Connected
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="max-w-2xl w-full text-center space-y-8">
          {/* Status Message */}
          <div className="space-y-4">
            {!isConnected ? (
              <>
                <h2 className="text-3xl font-bold text-foreground">
                  Welcome! I'm Kyle
                </h2>
                <p className="text-lg text-muted-foreground max-w-md mx-auto">
                  Your AI design consultant. Click the button below to start a voice conversation about your project.
                </p>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-semibold text-foreground">
                  {isSpeaking ? "Kyle is speaking..." : "Listening..."}
                </h2>
                <p className="text-muted-foreground">
                  Tell me about your design vision
                </p>
              </>
            )}
          </div>

          {/* Audio Visualization */}
          {isConnected && (
            <div className="py-8">
              <AudioWaves isActive={isConnected} isSpeaking={isSpeaking} />
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-destructive text-sm">
              {error}
            </div>
          )}

          {/* Main Action Button */}
          <div className="flex flex-col items-center gap-4">
            <Button
              onClick={toggleConversation}
              size="lg"
              className={`rounded-full w-20 h-20 ${
                isConnected 
                  ? 'bg-destructive hover:bg-destructive/90' 
                  : 'bg-primary hover:bg-primary/90'
              }`}
            >
              {isConnected ? (
                <Phone className="w-8 h-8" />
              ) : (
                <Mic className="w-8 h-8" />
              )}
            </Button>
            <span className="text-sm text-muted-foreground">
              {isConnected ? 'End conversation' : 'Start conversation'}
            </span>
          </div>

          {/* Contact Form Trigger */}
          {isConnected && (
            <div className="pt-8">
              <Button
                variant="outline"
                onClick={() => setShowContactForm(true)}
                className="gap-2"
              >
                <MicOff className="w-4 h-4" />
                Prefer to type? Leave your details
              </Button>
            </div>
          )}
        </div>
      </main>

      {/* Contact Form Modal */}
      {showContactForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-md w-full">
            <CardContent className="pt-6">
              <h3 className="text-xl font-semibold mb-4">Leave Your Details</h3>
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={contactInfo.name}
                    onChange={(e) => setContactInfo(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Your name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={contactInfo.email}
                    onChange={(e) => setContactInfo(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="your@email.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone (optional)</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={contactInfo.phone}
                    onChange={(e) => setContactInfo(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setShowContactForm(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1">
                    Submit
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Footer */}
      <footer className="p-4 border-t border-border/50 text-center">
        <p className="text-xs text-muted-foreground">
          Powered by AI • Your conversation helps us understand your design needs
        </p>
      </footer>
    </div>
  );
}
