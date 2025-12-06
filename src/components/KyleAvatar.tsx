import { cn } from "@/lib/utils";
import kylePhoto from "@/assets/kyle-avatar.jpeg";

interface KyleAvatarProps {
  size?: "sm" | "md" | "lg";
  speaking?: boolean;
}

export function KyleAvatar({ size = "lg", speaking = false }: KyleAvatarProps) {
  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-24 h-24",
    lg: "w-36 h-36",
  };

  return (
    <div className="relative">
      {/* Outer glow ring */}
      <div
        className={cn(
          "absolute inset-0 rounded-full bg-gradient-to-br from-primary/40 to-transparent",
          speaking && "animate-pulse-glow",
          size === "lg" && "-inset-3",
          size === "md" && "-inset-2",
          size === "sm" && "-inset-1"
        )}
      />
      
      {/* Inner ring */}
      <div
        className={cn(
          "absolute rounded-full border-2 border-primary/30",
          size === "lg" && "-inset-2",
          size === "md" && "-inset-1.5",
          size === "sm" && "-inset-1"
        )}
      />
      
      {/* Avatar container */}
      <div
        className={cn(
          "relative rounded-full overflow-hidden border-2 border-primary/50 bg-card",
          sizeClasses[size],
          speaking && "glow-red"
        )}
      >
        {/* Kyle's photo */}
        <img 
          src={kylePhoto} 
          alt="Kyle - AI Design Agent" 
          className="w-full h-full object-cover"
        />
      </div>

      {/* Status indicator */}
      <div
        className={cn(
          "absolute bottom-1 right-1 rounded-full bg-primary border-2 border-background",
          size === "lg" && "w-4 h-4",
          size === "md" && "w-3 h-3",
          size === "sm" && "w-2 h-2",
          speaking && "animate-pulse"
        )}
      />
    </div>
  );
}
