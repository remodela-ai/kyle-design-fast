import { cn } from "@/lib/utils";

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
        {/* Placeholder with Kyle initials */}
        <div className="w-full h-full bg-gradient-to-br from-muted to-card flex items-center justify-center">
          <span className={cn(
            "font-bold text-muted-foreground",
            size === "lg" && "text-4xl",
            size === "md" && "text-2xl",
            size === "sm" && "text-lg"
          )}>
            K
          </span>
        </div>
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
