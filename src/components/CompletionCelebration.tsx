import { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import { Gift, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CompletionCelebrationProps {
  isOpen: boolean;
  onClose: () => void;
  completionTime: string;
}

export function CompletionCelebration({ isOpen, onClose, completionTime }: CompletionCelebrationProps) {
  const [step, setStep] = useState<"gift" | "video" | "email">("gift");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Trigger confetti when modal opens
  useEffect(() => {
    if (isOpen && step === "gift") {
      // Fire red confetti for 3 seconds
      const duration = 3000;
      const end = Date.now() + duration;

      const colors = ["#dc2626", "#ef4444", "#f87171", "#b91c1c", "#991b1b"];

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: colors,
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: colors,
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };

      frame();

      // Move to video step after 3 seconds
      const timer = setTimeout(() => {
        setStep("video");
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isOpen, step]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setIsSubmitting(true);
    // Simulate sending email
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    onClose();
  };

  const handleVideoEnd = () => {
    setStep("email");
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-background border-border">
        {step === "gift" && (
          <div className="flex flex-col items-center justify-center py-8 animate-fade-in">
            <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mb-6 animate-pulse">
              <Gift className="h-12 w-12 text-primary" />
            </div>
            <DialogHeader className="text-center">
              <DialogTitle className="text-2xl font-bold text-foreground mb-2">
                Congratulations! 🎉
              </DialogTitle>
              <DialogDescription className="text-lg text-muted-foreground">
                Your design pre-project has been generated and will be sent to your email inbox!
              </DialogDescription>
            </DialogHeader>
            <p className="text-sm text-muted-foreground mt-4">
              Generated in {completionTime}
            </p>
          </div>
        )}

        {step === "video" && (
          <div className="flex flex-col items-center py-4 animate-fade-in">
            <DialogHeader className="text-center mb-4">
              <DialogTitle className="text-xl font-bold text-foreground">
                A Message from James & Kyle
              </DialogTitle>
            </DialogHeader>
            <div className="w-full aspect-video rounded-lg overflow-hidden bg-secondary mb-4">
              <video
                className="w-full h-full object-cover"
                autoPlay
                playsInline
                onEnded={handleVideoEnd}
              >
                <source src="/videos/james-kyle-welcome.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
            <Button 
              variant="outline" 
              onClick={handleVideoEnd}
              className="text-sm"
            >
              Skip Video
            </Button>
          </div>
        )}

        {step === "email" && (
          <div className="flex flex-col items-center py-4 animate-fade-in">
            <DialogHeader className="text-center mb-6">
              <DialogTitle className="text-xl font-bold text-foreground">
                Get Your Complete Design Package
              </DialogTitle>
              <DialogDescription className="text-muted-foreground mt-2">
                Enter your email to receive your pre-project and step-by-step guide for your new interior design project.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEmailSubmit} className="w-full space-y-4">
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full text-center text-lg py-6"
              />
              <Button 
                type="submit" 
                className="w-full py-6 text-lg font-semibold"
                disabled={isSubmitting || !email}
              >
                {isSubmitting ? "Sending..." : "Send My Design Package"}
              </Button>
            </form>
            <p className="text-xs text-muted-foreground mt-4 text-center">
              We'll send your complete design pre-project and a step-by-step guide to implement your dream interior.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
